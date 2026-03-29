import React from 'react';

export default function Layout({ children }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        body {
          font-family: "Plus Jakarta Sans", sans-serif !important;
        }

        html:not(.dark) body {
          background-color: #F0EAE1 !important;
        }

        h1, h2, h3 {
          font-family: "Cormorant Garamond", serif !important;
        }

        .neumorphic-feature-btn {
          background: #F0EAE1;
          border: none;
          box-shadow: 3px 3px 8px #C2BCB4, -2px -2px 6px #FEFAF4;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          padding: 8px 16px;
          transition: all 0.2s ease;
        }
        .neumorphic-feature-btn:hover {
          box-shadow: 6px 6px 14px #C2BCB4, -5px -5px 12px #FEFAF4;
        }
        .neumorphic-feature-btn:active {
          box-shadow: inset 3px 3px 8px #C2BCB4, inset -2px -2px 6px #FEFAF4;
        }
      `}</style>
      {children}
    </>
  );
}