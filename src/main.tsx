import { mountApp } from './app/mountApp';
import './styles/global.css';

const root = document.getElementById('root');
if (!root) throw new Error('Application root #root was not found');

void mountApp(root);
