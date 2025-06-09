import React from 'react'
import './button-login.css'

const Button = ({ onClick, type, label, className = '', disabled = false }) => (
    <button
        type={type}
        className={`custom-button ${className}`}
        onClick={onClick}
        disabled={disabled}
    >
        <p>{label}</p>
    </button>

);
export default Button