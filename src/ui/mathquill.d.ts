// MathQuill 0.10.1 ships no type declarations and is not an ES module — it is a browser script
// that reads window.jQuery on execution and writes window.MathQuill.
//
// This shorthand ambient declaration gives the import path an implicit `any`. It is the one
// place in the project where that is allowed, because the alternative is hand-maintaining a
// declaration file for a library we only touch through the narrow, explicitly typed surface in
// MathField.ts. Nothing else imports this path.
declare module 'mathquill/build/mathquill.js';
