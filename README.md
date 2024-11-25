To setup this project run these commands in terminal
=> npm i
=> npm install lucide-react

********************************************************************************************************************
How to use Formula
=> All formula should start with "="
=> There are only two formula evaluation function
    - SUM
    - AVERAGE
=> Both can be written in any case, be it lowercase or highercase
=> Though Column names should be Capital
=> Also To evaluate or run these formula in project, just double click on the cell where formula is written
********************************************************************************************************************


````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````
Copy Selection & Pasting Selection
=> Right now there no UI for how the selection of cell is captured though under the hood is captures the number of rows and columns and when you paste it you can see those values where copied.
````````````````````````````````````````````````````````````````````````````````````````````````````````````````````````


-------------------------------------------------------------------------------
Saving and Loading
=> There's no option to name the file which we try to save in the sheet
=> It get's saved as Spreadsheet.json in the computer by default
-------------------------------------------------------------------------------



# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
