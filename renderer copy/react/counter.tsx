import * as React from "react";

interface CounterProps {
	initialCount: number;
}

const Counter: React.FC<CounterProps> = ({ initialCount }) => {
	const [count, setCount] = React.useState(initialCount);

	return (
		<div className="interactive-counter">
			<p>Current Count: {count}</p>
			<button onClick={() => setCount((c) => c + 1)} type="button">
				Increment
			</button>
		</div>
	);
};

export default Counter;
