import {RuleStatesProvider} from "./components/RuleStatesProvider";
import {RuffConfigurator} from "./RuffConfigurator";

function App() {
  return (
    <RuleStatesProvider>
      <RuffConfigurator />
    </RuleStatesProvider>
  )
}

export default App
