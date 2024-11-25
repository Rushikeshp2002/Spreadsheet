/* eslint-disable no-unused-vars */


import { useState, useCallback, useEffect } from 'react';
import { Save, Upload, Plus, Copy, Clipboard } from 'lucide-react';

const DEFAULT_SHEET_SIZE = { rows: 10, columns: 10 };

const createEmptyCell = () => ({
  value: '',
  formula: '',
  format: { 
    bold: false, 
    backgroundColor: 'white' 
  }
});

const createEmptySheet = (rows, columns) => 
  Array(rows).fill().map(() => 
    Array(columns).fill().map(createEmptyCell)
  );

const Spreadsheet = () => {
  const [sheetData, setSheetData] = useState(
    createEmptySheet(DEFAULT_SHEET_SIZE.rows, DEFAULT_SHEET_SIZE.columns)
  );
  
  const [activeCell, setActiveCell] = useState(null);
  const [copiedSelection, setCopiedSelection] = useState(null);
  const [selectedRange, setSelectedRange] = useState(null);

  
  useEffect(() => {
    const handleKeyboardShortcuts = (e) => {
      if (!activeCell) return;

      
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copySelectedCells();
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        pasteSelectedCells(activeCell.row, activeCell.column);
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [activeCell, copiedSelection]); 

  const convertColumnToLetter = (columnIndex) => {
    let letter = '';
    while (columnIndex >= 0) {
      letter = String.fromCharCode((columnIndex % 26) + 65) + letter;
      columnIndex = Math.floor(columnIndex / 26) - 1;
    }
    return letter;
  };

  const convertLetterToColumnIndex = (columnLetters) => {
    let index = 0;
    for (let i = 0; i < columnLetters.length; i++) {
      index = index * 26 + columnLetters.charCodeAt(i) - 64;
    }
    return index - 1;
  };

  const evaluateSpreadsheetFormula = useCallback((formula, rowIndex, columnIndex) => {
    if (!formula.startsWith('=')) return formula;
    
    const formulaType = formula.substring(1, formula.indexOf('('));
    const cellRange = formula.substring(formula.indexOf('(') + 1, formula.indexOf(')'));
    const [rangeStart, rangeEnd] = cellRange.split(':');
    
    const startColumn = convertLetterToColumnIndex(rangeStart.match(/[A-Z]+/)[0]);
    const startRow = parseInt(rangeStart.match(/\d+/)[0]) - 1;
    const endColumn = convertLetterToColumnIndex(rangeEnd.match(/[A-Z]+/)[0]);
    const endRow = parseInt(rangeEnd.match(/\d+/)[0]) - 1;
    
    const selectedValues = [];
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startColumn; col <= endColumn; col++) {
        if (sheetData[row] && sheetData[row][col]) {
          const numericValue = parseFloat(sheetData[row][col].value);
          if (!isNaN(numericValue)) selectedValues.push(numericValue);
        }
      }
    }
    
    switch (formulaType.toUpperCase()) {
      case 'SUM': 
        return selectedValues.reduce((total, value) => total + value, 0).toString();
      case 'AVERAGE': 
        return (selectedValues.reduce((total, value) => total + value, 0) / selectedValues.length).toString();
      default: 
        return formula;
    }
  }, [sheetData]);

  const updateCellData = (rowIndex, columnIndex, newValue) => {
    const updatedSheetData = [...sheetData];
    updatedSheetData[rowIndex][columnIndex] = {
      ...updatedSheetData[rowIndex][columnIndex],
      value: newValue,
      formula: newValue.startsWith('=') ? newValue : ''
    };
    setSheetData(updatedSheetData);
  };

  const addNewRow = () => {
    const newRow = Array(sheetData[0].length).fill().map(createEmptyCell);
    setSheetData([...sheetData, newRow]);
  };

  const addNewColumn = () => {
    const updatedSheetData = sheetData.map(row => [
      ...row,
      createEmptyCell()
    ]);
    setSheetData(updatedSheetData);
  };

  const copySelectedCells = () => {
    if (selectedRange) {
      const { startRow, endRow, startColumn, endColumn } = selectedRange;
      const selectionToCopy = [];
      
      for (let row = startRow; row <= endRow; row++) {
        const rowData = [];
        for (let col = startColumn; col <= endColumn; col++) {
          rowData.push({ ...sheetData[row][col] });
        }
        selectionToCopy.push(rowData);
      }
      
      setCopiedSelection(selectionToCopy);
    } else if (activeCell) {
    
      const { row, column } = activeCell;
      setCopiedSelection([[{ ...sheetData[row][column] }]]);
    }
  };

  const pasteSelectedCells = (targetRow, targetColumn) => {
    if (!copiedSelection || targetRow === undefined || targetColumn === undefined) return;
    
    const updatedSheetData = [...sheetData];
    
    copiedSelection.forEach((copiedRow, rowOffset) => {
      copiedRow.forEach((cell, columnOffset) => {
        const newRowIndex = targetRow + rowOffset;
        const newColumnIndex = targetColumn + columnOffset;
        
        if (newRowIndex < sheetData.length && newColumnIndex < sheetData[0].length) {
          updatedSheetData[newRowIndex][newColumnIndex] = { ...cell };
        }
      });
    });
    
    setSheetData(updatedSheetData);
  };

  const saveSpreadsheet = () => {
    const spreadsheetJson = JSON.stringify(sheetData);
    const dataBlob = new Blob([spreadsheetJson], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(dataBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = 'spreadsheet.json';
    downloadLink.click();
    
    URL.revokeObjectURL(downloadUrl);
  };

  const loadSpreadsheet = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      const parsedSpreadsheetData = JSON.parse(e.target.result);
      setSheetData(parsedSpreadsheetData);
    };
    fileReader.readAsText(uploadedFile);
  };

  const toggleCellBoldFormat = () => {
    if (!activeCell) return;
    
    const { row, column } = activeCell;
    const updatedSheetData = [...sheetData];
    updatedSheetData[row][column].format.bold = !updatedSheetData[row][column].format.bold;
    
    setSheetData(updatedSheetData);
  };

  const setCellBackgroundColor = (color) => {
    if (!activeCell) return;
  
    const { row, column } = activeCell;
    const updatedSheetData = [...sheetData];
    
    updatedSheetData[row][column] = {
      ...updatedSheetData[row][column],
      format: {
        ...updatedSheetData[row][column].format,
        backgroundColor: color,
      },
    };
  
    setSheetData(updatedSheetData);
  };
  

  return (
    <div className="w-full h-screen mx-auto p-6 bg-white rounded-lg shadow-lg flex flex-col">
      <div className="mb-6 flex flex-wrap gap-3">
        <button 
          onClick={addNewRow} 
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} /> Add Row
        </button>
        <button 
          onClick={addNewColumn} 
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2 shadow-sm"
        >
          <Plus size={16} /> Add Column
        </button>
        <button 
          onClick={copySelectedCells} 
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2 shadow-sm"
          title="Copy (Ctrl/Cmd + C)"
        >
          <Copy size={16} /> Copy
        </button>
        <button 
          onClick={() => activeCell && pasteSelectedCells(activeCell.row, activeCell.column)} 
          className={`px-4 py-2 ${copiedSelection ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-400 cursor-not-allowed'} text-white rounded-md transition-colors duration-200 flex items-center gap-2 shadow-sm`}
          disabled={!copiedSelection}
          title="Paste (Ctrl/Cmd + V)"
        >
          <Clipboard size={16} /> Paste
        </button>
        <button 
          onClick={toggleCellBoldFormat} 
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-200 font-bold shadow-sm"
        >
          B
        </button>
        <input 
          type="color" 
          onChange={(e) => setCellBackgroundColor(e.target.value)}
          className="w-10 h-10 rounded-md cursor-pointer border-2 border-gray-300 hover:border-gray-400 transition-colors duration-200"
        />
        <button 
          onClick={saveSpreadsheet} 
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 flex items-center gap-2 shadow-sm"
        >
          <Save size={16} /> Save
        </button>
        <label className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 cursor-pointer flex items-center gap-2 shadow-sm">
          <Upload size={16} /> Load
          <input 
            type="file" 
            onChange={loadSpreadsheet}
            className="hidden"
            accept=".json"
          />
        </label>
      </div>

      <div className="flex-1 overflow-hidden border border-gray-200 rounded-lg shadow-sm">
      <div className="overflow-x-auto  h-full">
        <table className="border-collapse border-spacing-0 bg-white">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="sticky left-0 z-20 border border-gray-200 p-3 bg-gray-200 font-semibold text-gray-600 min-w-[64px] w-16"></th>
              {sheetData[0].map((_, columnIndex) => (
                <th key={columnIndex} className="border border-gray-200 p-3 bg-gray-200 font-semibold text-gray-600"
                style={{ minWidth: '150px', width: '150px' }}
                >
                  {convertColumnToLetter(columnIndex)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheetData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td className="sticky left-0 z-10 border border-gray-200 p-3 bg-gray-200 font-semibold text-gray-600 text-center min-w-[64px] w-16">
                  {rowIndex + 1}
                </td>
                {row.map((cell, columnIndex) => (
                  <td 
                    key={columnIndex}
                    className="border border-gray-200 p-0 m-0 relative"
                    style={{ 
                      backgroundColor: cell.format.backgroundColor || 'white',
                      minWidth: '150px',
                      width: '150px',
                      height: '50px', 
                    }}
                  >
                    <input
                      type="text"
                      value={cell.formula || cell.value}
                      onChange={(e) => updateCellData(rowIndex, columnIndex, e.target.value)}
                      onFocus={() => setActiveCell({ row: rowIndex, column: columnIndex })}
                      style={{
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        outline: 'none',
                        padding: '0', 
                        margin: '0',  
                        background: 'transparent', 
                      }}
                      onMouseDown={() => setSelectedRange({
                        startRow: rowIndex,
                        endRow: rowIndex,
                        startColumn: columnIndex,
                        endColumn: columnIndex
                      })}
                      onMouseUp={() => {
                        if (selectedRange) {
                          setSelectedRange({
                            ...selectedRange,
                            endRow: rowIndex,
                            endColumn: columnIndex
                          });
                        }
                      }}
                      onDoubleClick={() => {
                        if (cell.formula) {
                          const evaluatedValue = evaluateSpreadsheetFormula(cell.formula, rowIndex, columnIndex);
                          updateCellData(rowIndex, columnIndex, evaluatedValue);
                        }
                      }}
                      className={`w-full h-full px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-all duration-200 ${
                        cell.format.bold ? 'font-bold' : ''
                      } hover:bg-gray-50`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Spreadsheet;