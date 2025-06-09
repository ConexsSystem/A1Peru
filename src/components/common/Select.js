import React from 'react'
import './select.css'

const Select = ({ options, value, onChange, className = '', id = '' }) => (
    <select
        value={value}
        onChange={onChange}
        className={`custom-select ${className}`}
        id={id}
    >
        {options.map((option, index) => (
            <option key={index} value={option.value} disabled={option.disable}>
                {option.label}
            </option>
        ))}
    </select>
)

export default Select