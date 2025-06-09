// src/layout/TopBar.js
import React from 'react';
import './topbar.css';
import usr from '../image/usuario.png';
import Select from '../common/Select';
import { TbPlus, TbArrowBarToDown } from "react-icons/tb";
import ExportExcelButton from '../common/ExportExcelButton'; // Ajusta la ruta según tu estructura

const TopBar = ({
  title,
  icon,
  imageProfile,
  month,
  year,
  onMonthChange,
  onYearChange,
  showDateSelect = true,
  showButtonAdd = true,
  showButtonExport = true,
  onAddClick,
  onExportClick,
  exportData,             // Nueva prop para pasar los datos a exportar
  exportFileName = "export.xlsx",
  exportSheetName = "Sheet1",
  // Props para la búsqueda
  showSearch = false,
  searchValue = '',
  onSearchChange = () => { },
  searchPlaceholder = 'Buscar...'
}) => {
  const optionMonth = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  const optionYear = [
    { value: 2022, label: '2022' },
    { value: 2023, label: '2023' },
    { value: 2024, label: '2024' },
    { value: 2025, label: '2025' },
    { value: 2026, label: '2026' },
    { value: 2027, label: '2027' },
    { value: 2028, label: '2028' },
    { value: 2029, label: '2029' },
    { value: 2030, label: '2030' }
  ];

  return (
    <div className='top-bar'>
      <div className='title-topbar'>
        <h2>{title} {icon && <img className='icon-topbar' src={icon} alt='icono topbar' />}</h2>
        <img src={imageProfile || usr} className='image-usr-title' alt='imagen usuario' />
        {/* {icon && <img className='icon-topbar' src={icon} alt='icono topbar' />} */}
      </div>

      <div className='right-side'>
        <div className='group-buttons'>
          {showSearch && (
            <div className='search-container'>
              <input
                style={{ minWidth: '250px' }}
                className='input'
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}
          {showButtonAdd && (
            <button className='btn-add' onClick={onAddClick}>
              <TbPlus className='TbPlus' />
            </button>
          )}
          {showButtonExport && (
            exportData ? (
              <ExportExcelButton
                data={exportData}
                fileName={exportFileName}
                sheetName={exportSheetName}
                buttonClassName="btn-add"
              />
            ) : (
              <button className='btn-add' onClick={onExportClick}>
                <TbArrowBarToDown className='TbArrowBarToDown' />
              </button>
            )
          )}
        </div>
        {showDateSelect && (
          <div className='date-select'>
            <Select
              options={optionMonth}
              value={month}
              onChange={onMonthChange}
              className="type-document"
            />
            <Select
              options={optionYear}
              value={year}
              onChange={onYearChange}
              className="type-document"
            />
          </div>
        )}
        <img src={imageProfile || usr} className='image-usr' alt='imagen usuario' />
      </div>
    </div>
  );
};

export default TopBar;

// // src/layout/TopBar.js
// import React from 'react';
// import './topbar.css';
// import usr from '../image/usuario.png';
// import Select from '../common/Select';
// import { TbPlus, TbArrowBarToDown } from "react-icons/tb";
// import ExportExcelButton from '../common/ExportExcelButton'; // Ajusta la ruta según tu estructura

// const TopBar = ({
//   title,
//   icon,
//   imageProfile,
//   month,
//   year,
//   onMonthChange,
//   onYearChange,
//   showDateSelect = true,
//   showButtonAdd = true,
//   showButtonExport = true,
//   onAddClick,
//   onExportClick,
//   exportData,             // Nueva prop para pasar los datos a exportar
//   exportFileName = "export.xlsx",
//   exportSheetName = "Sheet1",
//   // Props para la búsqueda
//   showSearch = false,
//   searchValue = '',
//   onSearchChange = () => { },
//   searchPlaceholder = 'Buscar...'
// }) => {
//   const optionMonth = [
//     { value: 1, label: 'Enero' },
//     { value: 2, label: 'Febrero' },
//     { value: 3, label: 'Marzo' },
//     { value: 4, label: 'Abril' },
//     { value: 5, label: 'Mayo' },
//     { value: 6, label: 'Junio' },
//     { value: 7, label: 'Julio' },
//     { value: 8, label: 'Agosto' },
//     { value: 9, label: 'Septiembre' },
//     { value: 10, label: 'Octubre' },
//     { value: 11, label: 'Noviembre' },
//     { value: 12, label: 'Diciembre' }
//   ];

//   const optionYear = [
//     { value: 2022, label: '2022' },
//     { value: 2023, label: '2023' },
//     { value: 2024, label: '2024' },
//     { value: 2025, label: '2025' },
//     { value: 2026, label: '2026' },
//     { value: 2027, label: '2027' },
//     { value: 2028, label: '2028' },
//     { value: 2029, label: '2029' },
//     { value: 2030, label: '2030' }
//   ];

//   return (
//     <div className='top-bar'>
//       <div className='title-topbar'>
//         <h2>{title}</h2>
//         {icon && <img className='icon-topbar' src={icon} alt='icono topbar' />}
//       </div>

//       <div className='right-side'>
//         {showSearch && (
//           <div className='search-container'>
//             <input
//               style={{ minWidth: '250px' }}
//               className='input'
//               type="text"
//               placeholder={searchPlaceholder}
//               value={searchValue}
//               onChange={(e) => onSearchChange(e.target.value)}
//             />
//           </div>
//         )}
//         {showDateSelect && (
//           <>
//             <Select
//               options={optionMonth}
//               value={month}
//               onChange={onMonthChange}
//               className="type-document"
//             />
//             <Select
//               options={optionYear}
//               value={year}
//               onChange={onYearChange}
//               className="type-document"
//             />
//           </>
//         )}
//         {showButtonAdd && (
//           <button className='btn-add' onClick={onAddClick}>
//             <TbPlus className='TbPlus' />
//           </button>
//         )}
//         {showButtonExport && (
//           exportData ? (
//             <ExportExcelButton
//               data={exportData}
//               fileName={exportFileName}
//               sheetName={exportSheetName}
//               buttonClassName="btn-add"
//             />
//           ) : (
//             <button className='btn-add' onClick={onExportClick}>
//               <TbArrowBarToDown className='TbArrowBarToDown' />
//             </button>
//           )
//         )}
//         <img src={imageProfile || usr} className='image-usr' alt='imagen usuario' />
//       </div>
//     </div>
//   );
// };

// export default TopBar;


// // import React from 'react';
// // import './topbar.css';
// // import usr from '../image/usuario.png';
// // import Select from '../common/Select';
// // import { TbPlus, TbArrowBarToDown } from "react-icons/tb";

// // const TopBar = ({
// //   title,
// //   icon,
// //   imageProfile,
// //   month,
// //   year,
// //   onMonthChange,
// //   onYearChange,
// //   showDateSelect = true,
// //   showButtonAdd = true,
// //   showButtonExport = true,
// //   onAddClick,
// //   onExportClick,
// //   // Props para la búsqueda
// //   showSearch = false,
// //   searchValue = '',
// //   onSearchChange = () => { },
// //   searchPlaceholder = 'Buscar...'
// // }) => {
// //   const optionMonth = [
// //     { value: 1, label: 'Enero' },
// //     { value: 2, label: 'Febrero' },
// //     { value: 3, label: 'Marzo' },
// //     { value: 4, label: 'Abril' },
// //     { value: 5, label: 'Mayo' },
// //     { value: 6, label: 'Junio' },
// //     { value: 7, label: 'Julio' },
// //     { value: 8, label: 'Agosto' },
// //     { value: 9, label: 'Septiembre' },
// //     { value: 10, label: 'Octubre' },
// //     { value: 11, label: 'Noviembre' },
// //     { value: 12, label: 'Diciembre' }
// //   ];

// //   const optionYear = [
// //     { value: 2022, label: '2022' },
// //     { value: 2023, label: '2023' },
// //     { value: 2024, label: '2024' },
// //     { value: 2025, label: '2025' },
// //     { value: 2026, label: '2026' },
// //     { value: 2027, label: '2027' },
// //     { value: 2028, label: '2028' },
// //     { value: 2029, label: '2029' },
// //     { value: 2030, label: '2030' }
// //   ];

// //   return (
// //     <div className='top-bar'>
// //       <div className='title-topbar'>
// //         <h2>{title}</h2>
// //         {icon && <img className='icon-topbar' src={icon} alt='icono topbar' />}
// //       </div>


// //       <div className='right-side'>
// //         {showSearch && (
// //           <div className='search-container'>
// //             <input
// //             style={{ minWidth: '250px' }}
// //               className='input'
// //               type="text"
// //               placeholder={searchPlaceholder}
// //               value={searchValue}
// //               onChange={(e) => onSearchChange(e.target.value)}
// //             />
// //           </div>
// //         )}
// //         {showDateSelect && (
// //           <>
// //             <Select
// //               options={optionMonth}
// //               value={month}
// //               onChange={onMonthChange}
// //               className="type-document"
// //             />
// //             <Select
// //               options={optionYear}
// //               value={year}
// //               onChange={onYearChange}
// //               className="type-document"
// //             />
// //           </>
// //         )}
// //         {showButtonAdd && (
// //           <button className='btn-add' onClick={onAddClick}>
// //             <TbPlus className='TbPlus' />
// //           </button>
// //         )}
// //         {showButtonExport && (
// //           <button className='btn-add' onClick={onExportClick}>
// //             <TbArrowBarToDown className='TbArrowBarToDown' />
// //           </button>
// //         )}
// //         <img src={imageProfile || usr} className='image-usr' alt='imagen usuario' />
// //       </div>
// //     </div>
// //   );
// // };

// // export default TopBar;