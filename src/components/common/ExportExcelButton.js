// src/common/ExportExcelButton.js
import React from 'react';
import * as XLSX from 'xlsx';
import { TbArrowBarToDown } from "react-icons/tb";

const ExportExcelButton = ({
    data,                      // Array de objetos que se exportarán
    fileName = "export.xlsx",  // Nombre del archivo a descargar
    sheetName = "Sheet1",      // Nombre de la hoja dentro del Excel
    buttonClassName = "btn-add"
}) => {
    const handleExport = () => {
        // Genera una hoja a partir del array de objetos
        const worksheet = XLSX.utils.json_to_sheet(data);
        // Crea un nuevo libro y añade la hoja
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        // Escribe el libro en formato array
        const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        // Crea un Blob y genera una URL temporal para descargar
        const blob = new Blob([wbout], { type: "application/octet-stream" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <button className={buttonClassName} onClick={handleExport}>
            <TbArrowBarToDown className='TbArrowBarToDown' />
        </button>
    );
};

export default ExportExcelButton;
