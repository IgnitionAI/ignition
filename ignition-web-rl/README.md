# IgnitionAI Web Reinforcement Learning Demo

This project demonstrates the capabilities of IgnitionAI's reinforcement learning framework in a web environment. It features a 3D obstacle course where an agent learns to navigate and avoid moving obstacles to reach a target.

## Features

- **3D Environment**: Built with React Three Fiber and Rapier physics
- **Reinforcement Learning**: Powered by IgnitionAI's DQN implementation
- **Interactive Training**: Real-time visualization of the agent's learning process
- **Dynamic Obstacles**: Various movement patterns (horizontal, vertical, circular)
- **Futuristic Design**: Sleek, modern UI with metallic textures and dynamic lighting

## Technologies

- **Frontend**: React, TypeScript, Vite
- **3D Rendering**: Three.js, React Three Fiber
- **Physics**: Rapier (WebAssembly-based physics engine)
- **Machine Learning**: TensorFlow.js, IgnitionAI
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/IgnitionAI/ignition.git
   cd ignition/ignition-web-rl
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. **Start Training**: Click the "Start Training" button to begin the reinforcement learning process
2. **Reset Environment**: Use the reset button to start a new episode
3. **Adjust Parameters**: Modify learning parameters in the `Experience.tsx` file
4. **Observe Progress**: Watch the agent improve over time as it learns to navigate the environment

## Architecture

The project is structured as follows:

- `src/Experience.tsx`: Main environment setup and RL integration
- `src/simple-agent.tsx`: Agent visualization and physics
- `src/target.tsx`: Target object implementation
- `src/themes.ts`: Visual styling configuration

## Known Issues

- Rapier physics engine may occasionally throw Rust errors due to concurrent access to physics objects
- These errors are handled with try/catch blocks and proper synchronization

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- IgnitionAI team for the reinforcement learning framework
- React Three Fiber community for the 3D rendering capabilities
- Rapier team for the physics engine
