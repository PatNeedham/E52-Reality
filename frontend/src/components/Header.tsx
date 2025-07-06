import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';

const HeaderContainer = styled.header`
  padding: 1rem;
  background-color: #282c34;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.h1`
  cursor: pointer;
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
  transition: color 0.3s ease;

  &:hover {
    color: #61dafb;
  }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const LanguageControls = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const LanguageButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <HeaderContainer>
      <Logo onClick={() => navigate('/')}>{t('welcome')}</Logo>
      <Nav>
        <NavLink to='/library'>{t('my_library')}</NavLink>
        <NavLink to='/discover'>{t('discover')}</NavLink>
      </Nav>
      <LanguageControls>
        <LanguageButton onClick={() => changeLanguage('en')}>{t('english')}</LanguageButton>
        <LanguageButton onClick={() => changeLanguage('es')}>{t('spanish')}</LanguageButton>
      </LanguageControls>
    </HeaderContainer>
  );
};

export default Header;
