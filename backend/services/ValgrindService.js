const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class ValgrindService {
    async analyzeWithCategories(filePath) {
        const outputFilePath = filePath.replace(/\.[^/.]+$/, '.out');
        try {
            await this.compile(filePath, outputFilePath);
            const runtime = await this.getRuntime(outputFilePath);
            const valgrindOutput = await this.runValgrind(outputFilePath);
            const result = this.categorizeErrors(valgrindOutput, runtime);
            await this.cleanup(filePath, outputFilePath);
            return result;
        } catch (error) {
            throw error;
        }
    }

    categorizeErrors(valgrindOutput, runtime) {
        const categories = {
            memoryLeaks: [],
            invalidAccess: [],
            uninitializedValues: [],
            systemCalls: []
        };

        // Check if the output indicates no errors
        const hasNoErrors = valgrindOutput.includes('ERROR SUMMARY: 0 errors');
        
        if (!hasNoErrors) {
            const errorBlocks = valgrindOutput.split(/==\d+== (?=(?:Invalid|Conditional|Uninitialised|definitely lost|indirectly lost|possibly lost|still reachable))/g);

            for (const block of errorBlocks) {
                if (!block.trim()) continue;

                let errorInfo = block.trim();

                // Process errors for specific categories
                if (errorInfo.match(/definitely lost|indirectly lost|possibly lost|still reachable/i)) {
                    const leakMatch = errorInfo.match(/(definitely|indirectly|possibly) lost: ([0-9,]+ bytes)/);
                    if (leakMatch) {
                        errorInfo = `${leakMatch[1]} lost: ${leakMatch[2]}`;
                        categories.memoryLeaks.push(errorInfo);
                    }
                } else if (errorInfo.match(/Invalid (read|write) of size/i)) {
                    const locationMatch = errorInfo.match(/at (.+?)(?=\n|$)/);
                    const sizeMatch = errorInfo.match(/Invalid (read|write) of size (\d+)/);
                    if (sizeMatch && locationMatch) {
                        errorInfo = `Invalid ${sizeMatch[1]} of size ${sizeMatch[2]} at ${locationMatch[1]}`;
                        categories.invalidAccess.push(errorInfo);
                    }
                } else if (errorInfo.match(/Uninitialised|Conditional jump or move depends on uninitialised value/i)) {
                    const contextMatch = errorInfo.match(/Use of uninitialised value of size (\d+)/);
                    if (contextMatch) {
                        errorInfo = `Uninitialized value used (size: ${contextMatch[1]} bytes)`;
                        categories.uninitializedValues.push(errorInfo);
                    }
                } else if (errorInfo.match(/syscall .+ (read|write)/i)) {
                    const syscallMatch = errorInfo.match(/syscall (.+?) \(/);
                    if (syscallMatch) {
                        errorInfo = `System call error in ${syscallMatch[1]}`;
                        categories.systemCalls.push(errorInfo);
                    }
                }

                const stackTrace = block.match(/at (.+?)(?=\n|$)/g);
                const belongsToCategory = Object.values(categories).some(catArray => catArray.includes(errorInfo));
                if (stackTrace && belongsToCategory) {
                    errorInfo += '\nStack trace:\n' + stackTrace.map(trace => '  ' + trace.trim()).join('\n');
                }
            }
        }
        

        // Extract heap usage data
        const heapMatch = valgrindOutput.match(/total heap usage: ([\d,]+) allocs, ([\d,]+) frees, ([\d,]+) bytes allocated/);
        const heapUsage = heapMatch ? {
            allocations: parseInt(heapMatch[1].replace(/,/g, '')),
            frees: parseInt(heapMatch[2].replace(/,/g, '')),
            bytesAllocated: parseInt(heapMatch[3].replace(/,/g, ''))
        } : null;

        // Extract memory leak summary
        const leakSummary = {
            definitelyLost: this.extractLeakInfo(valgrindOutput, 'definitely lost'),
            indirectlyLost: this.extractLeakInfo(valgrindOutput, 'indirectly lost'),
            possiblyLost: this.extractLeakInfo(valgrindOutput, 'possibly lost'),
            stillReachable: this.extractLeakInfo(valgrindOutput, 'still reachable')
        };

        const summary = {
            totalErrors: Object.values(categories).reduce((sum, arr) => sum + arr.length, 0),
            categoryCounts: {},
            runtime: runtime ? `${runtime.toFixed(2)}ms` : 'Not available',
            heapUsage: heapUsage ? {
                allocations: heapUsage.allocations.toLocaleString(),
                frees: heapUsage.frees.toLocaleString(),
                bytesAllocated: this.formatBytes(heapUsage.bytesAllocated),
                unfreedAllocations: (heapUsage.allocations - heapUsage.frees).toLocaleString()
            } : 'Not available',
            memoryLeakSummary: leakSummary
        };

        for (const [category, errors] of Object.entries(categories)) {
            summary.categoryCounts[category] = errors.length;
        }

        return {
            categories,
            summary,
            rawOutput: valgrindOutput
        };
    }

    extractLeakInfo(output, type) {
        const match = output.match(new RegExp(`${type}: ([\\d,]+ bytes) in ([\\d,]+) blocks`));
        if (match) {
            return {
                bytes: match[1],
                blocks: parseInt(match[2].replace(/,/g, '')).toLocaleString()
            };
        }
        return null;
    }

    formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
        else return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }

    async compareAnalysis(filePath1, filePath2) {
        const result1 = await this.analyzeWithCategories(filePath1);
        const result2 = await this.analyzeWithCategories(filePath2);

        return {
            file1: {
                name: path.basename(filePath1),
                analysis: result1
            },
            file2: {
                name: path.basename(filePath2),
                analysis: result2
            },
            comparison: this.generateComparison(result1, result2)
        };
    }

    generateComparison(result1, result2) {
        const comparison = {
            categoryDifferences: {},
            newErrors: {},
            resolvedErrors: {}
        };

        // Compare counts for each category
        for (const category in result1.summary.categoryCounts) {
            const count1 = result1.summary.categoryCounts[category];
            const count2 = result2.summary.categoryCounts[category];
            comparison.categoryDifferences[category] = {
                difference: count2 - count1,
                percentage: count1 === 0 ? 'N/A' : ((count2 - count1) / count1 * 100).toFixed(2) + '%'
            };
        }

        // Find new and resolved errors for each category
        for (const category in result1.categories) {
            comparison.newErrors[category] = result2.categories[category].filter(
                error => !result1.categories[category].includes(error)
            );
            comparison.resolvedErrors[category] = result1.categories[category].filter(
                error => !result2.categories[category].includes(error)
            );
        }

        return comparison;
    }

    async runCustomAnalysis(filePath, errorTypes) {
        const outputFilePath = filePath.replace(/\.[^/.]+$/, '.out');
        
        try {
            await this.compile(filePath, outputFilePath);
            const valgrindOutput = await this.runValgrind(outputFilePath);
            const fullAnalysis = this.categorizeErrors(valgrindOutput);
            
            // Filter results based on requested error types
            const filteredCategories = {};
            for (const errorType of errorTypes) {
                if (fullAnalysis.categories[errorType]) {
                    filteredCategories[errorType] = fullAnalysis.categories[errorType];
                }
            }

            const filteredSummary = {
                totalErrors: Object.values(filteredCategories).reduce((sum, arr) => sum + arr.length, 0),
                categoryCounts: {}
            };

            for (const [category, errors] of Object.entries(filteredCategories)) {
                filteredSummary.categoryCounts[category] = errors.length;
            }

            await this.cleanup(filePath, outputFilePath);
            
            return {
                categories: filteredCategories,
                summary: filteredSummary
            };
        } catch (error) {
            throw error;
        }
    }

    compile(filePath, outputFilePath) {
        return new Promise((resolve, reject) => {
            exec(`gcc -g ${filePath} -o ${outputFilePath}`, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`Compilation error: ${stderr}`));
                }
                resolve(stdout);
            });
        });
    }


    getRuntime(outputFilePath) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            exec(outputFilePath, (error, stdout, stderr) => {
                const endTime = Date.now();
                if (error && !stderr) {
                    resolve(null);
                }
                resolve((endTime - startTime));
            });
        });
    }




    runValgrind(outputFilePath) {
        return new Promise((resolve, reject) => {
            exec(`valgrind --leak-check=full ${outputFilePath}`, (error, stdout, stderr) => {
                if (error && !stderr) {
                    reject(new Error(`Valgrind execution failed: ${error.message}`));
                }
                resolve(stderr);
            });
        });
    }

    async cleanup(filePath, outputFilePath) {
        try {
            await fs.unlink(filePath);
            await fs.unlink(outputFilePath);
        } catch (error) {
            console.error('Cleanup error:', error);
        }
    }
}

module.exports = new ValgrindService();