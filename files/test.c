#include <stdlib.h>
#include <string.h>

int main() {
    // Memory leak
    int* leak = malloc(sizeof(int));
    *leak = 42;
    // Forgot to free leak

    // Invalid access
    int* arr = malloc(5 * sizeof(int));
    arr[5] = 10;  // Out of bounds write
    free(arr);
    
    // Use after free
    int* ptr = malloc(sizeof(int));
    free(ptr);
    *ptr = 5;  // Invalid write
    
    // Uninitialized value
    int uninit;
    if(uninit > 0) {  // Using uninitialized variable
        return 1;
    }
    
    return 0;
}