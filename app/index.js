import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
// import { configureStore, history } from './store/configureStore';
// import './app.global.css';
// const store = configureStore();
import Home from './components/Home'

render(
  <Home />,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept('./components/Home', () => {
    // eslint-disable-next-line global-require
    render(
      <AppContainer>
        <Home />
      </AppContainer>,
      document.getElementById('root')
    );
  });
}
