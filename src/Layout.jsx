import React from 'react';

export default function Layout({ children }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

        body {
          background-color: #F0EAE1 !important;
          font-family: "Plus Jakarta Sans", sans-serif !important;
        }

        h1, h2, h3 {
          font-family: "Cormorant Garamond", serif !important;
        }
      `}</style>
      {children}
    </>
  );
}