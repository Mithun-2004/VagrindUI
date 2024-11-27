#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void printMessage(const char *message) {
    size_t length = strlen(message) + 1; // Calculate required size
    char *buffer = (char *)malloc(length);
    if (buffer) {
        strcpy(buffer, message);
        printf("%s\n", buffer);
        free(buffer); // Free allocated memory
    } else {
        fprintf(stderr, "Memory allocation failed\n");
    }
}

int main() {
    char dynamicMemory[20]; // Use stack allocation instead of dynamic allocation
    strncpy(dynamicMemory, "Hello, Valgrind!", sizeof(dynamicMemory) - 1);
    dynamicMemory[sizeof(dynamicMemory) - 1] = '\0'; // Ensure null-termination
    printf("%s\n", dynamicMemory);

    printMessage("Hi, there!");
    return 0;
}
