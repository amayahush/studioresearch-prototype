import React from 'react';
import htm from 'htm';

export const html = htm.bind(React.createElement);
export const { useState, useEffect, useRef, useMemo, useCallback, useContext, createContext, useReducer, Fragment } = React;

export const cx = (...parts) => parts.filter(Boolean).join(' ');
