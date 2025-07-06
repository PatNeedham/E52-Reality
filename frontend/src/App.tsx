import React from 'react';
import { Outlet } from 'react-router-dom';
import styled from '@emotion/styled';
import { Global, css } from '@emotion/react';
import Header from './components/Header';

const GlobalStyles = css`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html,
  body {
    height: 100%;
    font-family:
      -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
      'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  #root {
    height: 100%;
  }

  code {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
  }
`;

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Main = styled.main`
  flex: 1;
  overflow-x: hidden;
`;

const Footer = styled.footer`
  background-color: #f8f9fa;
  border-top: 1px solid #dee2e6;
  padding: 1rem 0;
  margin-top: auto;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  text-align: center;
  color: #6c757d;
  font-size: 0.875rem;
`;

const App: React.FC = () => {
  return (
    <>
      <Global styles={GlobalStyles} />
      <AppContainer>
        <Header />
        <Main>
          <Outlet />
        </Main>
        <Footer>
          <FooterContent>© 2025 Needham. All rights reserved.</FooterContent>
        </Footer>
      </AppContainer>
    </>
  );
};

export default App;
