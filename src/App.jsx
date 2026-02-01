
import "./App.css";
import Routess from "./Routes";
import { Toaster } from "react-hot-toast";
// import { AppProvider } from "./Context/Context";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./redux/store";
import { setAuthToken } from "./api/client";
import { fetchCsoProfile } from "./redux/slices/csoAuthSlice";

const token = store.getState().csoAuth?.token;
if (token) {
  setAuthToken(token);
  store.dispatch(fetchCsoProfile());
}

function App() {
  return (
    <Provider store={store}>
      <div className="">
        <BrowserRouter>
          <Routess />
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    </Provider>
  );
}

export default App;


