# JavaScript
## Execution Context
- Everything in JavaScript happens inside an Execution Context.
- We can assume this Execution Context as an big container in which whole javascript is executed.
- Execution Context is like a big box where there are two components :-
    * Memory Component
        - Here, all the variables and functions are stored as a key value pair.
        - This memory component is also called as Variable environment.

    * Code component
        - This is the place where the code is executed one line at a time.
        - It is also known as thread of execution.
        - Thread of execution is just like a thread where whole code is executed one line at a time.
    Note:-
    - JavaScript is a synchronous single threaded language. This means it can only execute one command at a time in a specific order. This means it can only go to the next line once the current line has finished executing.

## What happens when you run JavaScript code ?
- When you run a javascript program an execution context is created.
* Code Example 0.1 
```js
    var n=2;
    function square (num){
        var ans = num*num;
        return ans;
    }
    var square2 = square(n);
    var square3 = square(4);
```
- Execution phases is created in two phases.
    * Creation phase ( Memory Creation phase) ( 1st phase)
        - For the code 0.1, JavaScript will allocate the memory for all the variables and functions.
        - Looking at the example 0.1, the variable n and the function square is getting the memory at the Memory component of execution context.
        - Initially variable n stores the special value undefined in the first phase. Similarly, the function square stores the whole code of the function which is defined as it is.
        - Then square2 and square3 will also be allocated the memory. Since both are variables they will be assigned the value undefined.
        - So in the first phase all the variables and functions are read by js line by line and assigned the value by js accordingly. If it is variable it will be assigned undefined and if it is an function whole body of the function will be assigned.
        - undefined is a placeholder and special keyword in js which can be assigned to any variable in the initial phase by js.   
    * Code Execution phase ( 2nd phase)
        - After the Memory allotment, js again scans through the whole code line by line and execute the code.
        - As soon as the js detects the value of n variable is 2, it allocates the value 2 in the memory component for variable n.
        - When the js encounters the square2(n) a brand new execution context is created inside the code component itself. Now, again that execution context will again have memory component as well code component.
        - Inside the new execution context again there will be two phases involves one is creation phase and the second one is code execution phase.
        - All the variables and functions inside this function will be allocated memory in the execution context. 
        - For example the variable num and ans will be allocated memory in the execution context of square2() function call.
        
