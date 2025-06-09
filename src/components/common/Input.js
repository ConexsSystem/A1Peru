import React from 'react';
import './input.css';

const Input = ({ type = 'text', placeholder = '', value, onChange, onFocus, onClick, checked, className = '', id = '', maxlength, disabled }) => (
    <input
        className={`input ${className}`}
        type={type}
        placeholder={placeholder}
        value={type === 'checkbox' ? undefined : value} // Evitar 'value' en checkbox
        checked={type === 'checkbox' ? checked : undefined} // Añadir 'checked' si es checkbox
        onChange={onChange}
        onFocus={onFocus}
        onClick={onClick}
        id={id}
        disabled={disabled}
        maxLength={maxlength}
    />
);

export default Input;
