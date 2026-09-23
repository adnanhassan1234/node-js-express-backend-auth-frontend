import './App.css';
import Home from './Home';
import { Switch, Route } from 'react-router-dom';
import Payment from './pages/Payment';
import SuccessPayment from './components/SuccessPayment';
import Dashboard from './Dashboard';

const App = () => {
  return (
    <>
      <Switch>
        <Route exact path="/" component={Dashboard} />
        <Route exact path="/dashboard" component={Dashboard} />
        <Route exact path="/chat" component={Home} />
        <Route exact path="/payment" component={Payment} />
        <Route path="/success-payment" component={SuccessPayment} />
      </Switch>
    </>
  );
};

export default App;
