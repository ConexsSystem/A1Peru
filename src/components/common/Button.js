import React from 'react'
import './button.css'

const Button = ({ onClick, type, label, className = '', disabled = false }) => (
    <button
        type={type}
        className={`custom-button ${className}`}
        onClick={onClick}
        disabled={disabled}
    >
        {label}
    </button>

);
export default Button