import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <span className="footer-credit">
          Created by{' '}
          <a 
            href="https://curate.beauty" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-link"
          >
            Erin Saint Gull
          </a>
        </span>
        <span className="footer-separator">•</span>
        <a 
          href="https://github.com/saintgull/torontocalendar" 
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          Find the code for this website here
        </a>
      </div>
    </footer>
  );
};

export default Footer;