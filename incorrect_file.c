#include <stdio.h>
#include <stdlib.h>

int main() {
    int *arr = (int *)malloc(5 * sizeof(int));

    // Simulate usage of array
    for (int i = 0; i <= 5; i++) {
        arr[i] = i;  // Incorrectly accessing out of bounds
    }

    // Forgetting to free memory, causing a memory leak
    return 0;
}
