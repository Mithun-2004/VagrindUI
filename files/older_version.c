#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void printMessage(const char *message) {
    char *buffer = (char *)malloc(10);  // Allocating insufficient memory
    strcpy(buffer, message);           // This may cause buffer overflow
    printf("%s\n", buffer);
    // Missing free(buffer); causes memory leak
}

int main() {
    char *dynamicMemory = (char *)malloc(20);  // Allocate memory
    strcpy(dynamicMemory, "Hello, Valgrind!"); // No bounds checking
    printf("%s\n", dynamicMemory);

    // Missing free(dynamicMemory); causes memory leak

    printMessage("Hi, there!");
    return 0;
}
