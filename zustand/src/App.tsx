import useStore from "./store/store";
import './App.css';
const App = () => {
  const count=useStore(state=>state.count);
  const increase=useStore(state=>state.increase);
  const decrease=useStore(state=>state.decrease);
  return <div className="bg-slate-900 text-white flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="bg-slate-100 text-slate-900 hover:bg-slate-200 hover:text-slate-800 rounded-lg px-4 py-2 ">Counter</h1>
      <div className="flex justify-center items-center gap-8">
      <button onClick={increase} disabled={count===10} className="bg-slate-100  disabled:bg-slate-500 cursor-pointer text-slate-900 px-2 py-1 rounded-full">+</button>
      <p>{count}</p>
      <button onClick={decrease} disabled={count===0} className="bg-slate-100 disabled:bg-slate-500 cursor-pointer text-slate-900 px-2 py-1 rounded-full">-</button>
      </div>
  </div>;
};
export default App;