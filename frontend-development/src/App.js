import './App.css';
import Home from './Home';
import { Switch, Route } from 'react-router-dom';
import Payment from './pages/Payment';
import SuccessPayment from './components/SuccessPayment';

const App = () => {
  return (
    <>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route exact path="/payment" component={Payment} />
        <Route path="/success-payment" element={<SuccessPayment />} />
      </Switch>
    </>
  );
};

export default App;
