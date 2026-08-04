# Desmos 2.0 — Mathematical Capability Catalog

Every operation, object and plot type worth considering. Each entry: what it is, what it's
actually used for, and a build-cost estimate.

**Cost key:** `E` easy (days) · `M` moderate (1–2 weeks) · `H` hard (weeks) · `XH` very hard (months)
**Flag:** ★ = strongly recommended given the stated use cases (calculus · ODEs/physics · linear algebra/data)

---

## A. Limits, series and asymptotics

*Desmos has none of this. Sum and product bounds must be finite integers.*

| Capability | What it is | Real-world use | Cost |
|---|---|---|---|
| ★ **Limits** | `lim` as x→a, one-sided, and x→±∞ | Definition of derivatives and integrals; asymptotic behaviour of circuits, populations, algorithms | `M` |
| ★ **Infinite sums** | `Σ` with an ∞ bound, plus convergence acceleration | Fourier coefficients, perturbation theory, present value of a perpetuity, probability generating functions | `M` |
| ★ **Infinite products** | `Π` with an ∞ bound | Euler product for primes, Weierstrass factorisation, wave scattering | `M` |
| **Convergence tests** | Ratio, root, integral, alternating, comparison — with a verdict | Stops you trusting a divergent numeric sum; essential for honest results | `M` |
| ★ **Taylor / Maclaurin series** | Polynomial approximation about a point, with error bound | How calculators compute sin/exp; linearising any nonlinear system | `M` |
| **Laurent series** | Expansion allowing negative powers, around a pole | Complex analysis, residue calculation, control-system stability | `H` |
| **Padé approximants** | Rational-function approximation; far better than Taylor far from the centre | Transfer-function reduction, time-delay modelling in control | `H` |
| **Asymptotic expansions** | Behaviour as x→∞ (Stirling, Laplace method) | Algorithm complexity, statistical mechanics, large-sample statistics | `H` |
| **Continued fractions** | Iterated fraction representation of a number or function | Best rational approximations, gear ratios, calendar design, number theory | `M` |

---

## B. Calculus operators

| Capability | What it is | Real-world use | Cost |
|---|---|---|---|
| ★ **Symbolic derivative** | Exact d/dx, not a numeric approximation | Everything downstream: optimisation, sensitivity, error propagation | `M` |
| ★ **Partial derivatives** | ∂f/∂x for multivariable f | Thermodynamics, economics (marginal rates), any multivariable model | `M` |
| ★ **Gradient ∇f** | Vector of steepest ascent | Machine-learning training, terrain analysis, potential fields | `E` |
| ★ **Jacobian** | Matrix of all first partials of a vector function | Stiff ODE solvers, robot kinematics, coordinate-change scaling | `M` |
| ★ **Hessian** | Matrix of second partials | Classifying maxima/minima/saddles; Newton optimisation; stability analysis | `M` |
| ★ **Divergence ∇·F** | Net outflow of a vector field at a point | Fluid sources/sinks, charge density from an electric field (Gauss) | `E` |
| ★ **Curl ∇×F** | Local rotation of a vector field | Vorticity in fluids, magnetic field from current (Ampère) | `E` |
| **Laplacian ∇²f** | Divergence of the gradient | Heat diffusion, wave propagation, image edge detection, electrostatics | `E` |
| ★ **Definite integral** | Numeric area with adaptive quadrature and error estimate | Work, charge, probability mass, accumulated cost | `E` |
| ★ **Indefinite integral** | Symbolic antiderivative | Closed-form solutions instead of numbers | `XH` (delegate to CAS engine) |
| **Multiple integrals** | Double and triple integrals over regions | Mass, centre of mass, moment of inertia, 3-D probability | `M` |
| **Line & surface integrals** | Integration along a curve or over a surface | Work done by a force, flux through a surface, Maxwell's equations | `H` |
| **Arc length, curvature, torsion** | Geometry of a curve; the Frenet frame | Road and rail design, camera paths, DNA supercoiling | `M` |
| **Vector calculus theorems** | Green, Stokes, Divergence — verified numerically | Converts hard surface integrals into easy line integrals in EM and fluids | `H` |

---

## C. Differential equations and dynamical systems

*The single largest capability gap. GeoGebra solves DEs; Desmos cannot at all.*

| Capability | What it is | Real-world use | Cost |
|---|---|---|---|
| ★ **ODE initial-value solver** | Adaptive Dormand–Prince RK45 | Projectiles with drag, RC/RLC circuits, chemical kinetics, population models | `M` |
| ★ **Stiff solver** | Rosenbrock or BDF, using autodiff Jacobians | Chemical reaction networks, control systems, anything with fast+slow timescales | `H` |
| **Boundary-value solver** | Shooting or collocation for two-point problems | Beam deflection, heat distribution with fixed ends, quantum wells | `H` |
| ★ **Systems of ODEs** | Coupled first-order systems | Predator–prey, epidemics (SIR), coupled oscillators, orbital mechanics | `M` |
| ★ **Slope / direction fields** | Little tangent segments showing dy/dx everywhere | See the whole solution family at once without solving anything | `E` |
| ★ **Phase portraits** | Trajectories in state space rather than versus time | Nonlinear stability, limit cycles, oscillator behaviour | `M` |
| **Nullclines & fixed points** | Where each derivative vanishes; equilibria classified by eigenvalues | Predicts long-run behaviour of an ecosystem, market or circuit | `M` |
| **Bifurcation diagrams** | How equilibria change as a parameter varies | Tipping points in climate, buckling loads, onset of oscillation | `H` |
| **Poincaré sections** | Slices through a trajectory to expose structure | Chaos detection, orbital resonance, cardiac rhythm analysis | `H` |
| **Lyapunov exponents** | Rate of divergence of nearby trajectories | Quantifies chaos; weather predictability horizons | `H` |
| **PDE solvers** | Heat, wave, Laplace/Poisson by finite differences | Temperature distribution, vibration modes, electrostatic potential | `XH` |
| **Event detection** | Stop or react when a condition is met mid-integration | Bounce on impact, stop at apogee, trigger a control switch | `M` |

---

## D. Linear algebra

*Desmos's matrix calculator is a separate, weaker product with no decompositions.*

| Capability | What it is | Real-world use | Cost |
|---|---|---|---|
| ★ **Full matrix type** | Add, multiply, transpose, inverse, determinant, trace, rank, power | Foundation for everything else here | `M` |
| ★ **Eigenvalues & eigenvectors** | Directions a transformation only stretches | Vibration modes, PageRank, principal component analysis, quantum states, stability | `H` |
| ★ **SVD** | Decomposition into rotate–stretch–rotate | Image compression, recommender systems, noise reduction, pseudo-inverse | `H` |
| **LU / QR / Cholesky** | Factorisations for solving and least squares | Fast repeated solves, regression fitting, simulation inner loops | `M` |
| **Least squares & pseudo-inverse** | Best solution to an over-determined system | Curve fitting, GPS trilateration, sensor fusion, calibration | `M` |
| **Null space / column space / basis** | The subspaces a matrix maps from and into | Redundancy in structures, solvability of a system, degrees of freedom | `M` |
| ★ **Linear transformation visualiser** | Animate the grid deforming under a matrix — the 3Blue1Brown view | Makes determinants, eigenvectors and composition *obvious* rather than symbolic | `M` |
| **Gram–Schmidt / orthogonalisation** | Build an orthonormal basis | Numerical stability, QR, signal decorrelation | `E` |
| **Quadratic forms & conics** | xᵀAx and its geometry | Optimisation landscapes, error ellipses, principal stresses | `M` |
| **Jordan / Schur forms** | Canonical forms for defective matrices | Repeated-eigenvalue ODE solutions, control theory | `XH` |
| **Matrix exponential eᴬᵗ** | Solves linear ODE systems in one shot | Control systems, Markov chains in continuous time, coupled oscillators | `H` |

---

## E. Tensors and multilinear algebra

| Capability | What it is | Real-world use | Cost |
|---|---|---|---|
| **Tensor type + index notation** | Multi-dimensional arrays with Einstein summation | The language of continuum mechanics and relativity | `H` |
| **Contraction / outer product** | Summing over shared indices; building higher-rank tensors | Stress analysis, ML tensor operations | `M` |
| **Metric tensor** | Defines distance and angle on a curved space | General relativity, curved-surface geometry, map projections | `H` |
| **Christoffel symbols & covariant derivative** | How to differentiate on a curved space | Geodesics, GR field equations, robotics on manifolds | `XH` |
| **Riemann / Ricci curvature** | Intrinsic curvature of a space | Einstein's equations, shape analysis | `XH` |
| **Stress & strain tensors** | Internal forces and deformation in a material | Structural engineering, failure analysis, material science | `M` |
| **Inertia tensor** | How mass is distributed for rotation | Spacecraft attitude, flywheels, rigid-body dynamics | `E` |

---

## F. Complex analysis and the imaginary plane

*Desmos has complex arithmetic but no way to see a complex **function**.*

| Capability | What it is | Real-world use | Cost |
|---|---|---|---|
| ★ **Complex plane view** | Dedicated Argand-plane mode | Natural home for phasors, roots, and everything below | `E` |
| ★ **Domain colouring** | Hue = argument, lightness = modulus — an entire complex function as one image | Instantly reveals zeros, poles and branch cuts; the standard tool of the field | `M` (`E` on GPU) |
| **Conformal maps** | Angle-preserving transformations of the plane | Aerofoil design (Joukowski), heat flow in odd geometries, map projections | `M` |
| **Poles, zeros and residues** | Singularity structure of a function | Filter design, control-system stability, evaluating hard real integrals | `H` |
| **Contour integration** | Integration along a path in the complex plane | Inverse Laplace transforms, quantum field theory, signal analysis | `H` |
| **Riemann surfaces** | Multi-sheeted domains that make √z and log z single-valued | Branch-cut intuition, algebraic geometry | `XH` |
| **Möbius transformations** | (az+b)/(cz+d) — the symmetries of the sphere | Hyperbolic geometry, special relativity, computer graphics | `E` |
| **Analytic continuation** | Extending a function beyond its original domain | Zeta function and the Riemann hypothesis, renormalisation in physics | `XH` |

---

## G. Transforms and signal analysis

| Capability | What it is | Real-world use | Cost |
|---|---|---|---|
| ★ **Fourier series** | Decompose a periodic function into sines and cosines | Sound synthesis, vibration analysis, heat conduction, the epicycle drawings | `M` |
| ★ **Fourier transform / FFT** | Move between time and frequency | MP3 and JPEG compression, MRI reconstruction, spectrum analysers, noise filtering | `M` |
| ★ **Laplace transform** | Convert differential equations into algebra | Circuit analysis, control systems, transient response | `H` |
| **Inverse Laplace** | Back to the time domain | Reading off system step and impulse responses | `H` |
| **Z-transform** | Discrete-time analogue of Laplace | Digital filter design, discrete control, DSP | `H` |
| **Wavelet transform** | Frequency content localised *in time* | Seismic analysis, ECG and biomedical signals, image denoising, financial time series | `H` |
| **Convolution & correlation** | Blending two functions; measuring similarity | Filtering, image blur/sharpen, neural network layers, echo and reverb | `E` |
| **Transfer functions, Bode & Nyquist** | Frequency response and stability margins | Every control system ever tuned; audio equaliser design | `M` |
| **Hilbert transform** | Extracts instantaneous amplitude and phase | AM/FM demodulation, envelope detection, vibration diagnostics | `M` |

---

## H. Geometry, surfaces and topology

| Capability | What it is | Real-world use | Cost |
|---|---|---|---|
| ★ **Parametric curves & surfaces** | Shapes defined by parameters rather than equations | CAD, animation paths, orbital tracks | `E` |
| **Implicit surfaces (3-D)** | f(x,y,z)=0 via marching cubes | Molecular surfaces, level sets, blended shapes | `H` |
| **Surfaces of revolution** | Spin a curve around an axis | Lathe parts, volume/surface-area problems, pressure vessels | `E` |
| **Gaussian & mean curvature** | Intrinsic and extrinsic bending of a surface | Why maps distort, architectural shells, lens design | `M` |
| **Geodesics** | Shortest paths on a curved surface | Flight routes, GPS, relativity, robot path planning | `H` |
| **Fractals / IFS** | Self-similar sets from iterated maps | Antenna design, terrain generation, compression, coastline modelling | `E` |
| **Mandelbrot & Julia sets** | Iteration escape-time in the complex plane | The canonical complex-dynamics visual; also a good GPU stress test | `E` |
| **Knots & links** | Closed curves in 3-D and their invariants | DNA topology, polymer physics, quantum computing | `H` |
| **Non-orientable surfaces** | Möbius strip, Klein bottle | Topology intuition; occasionally materials science | `M` |

---

## I. Four dimensions and geometric algebra

| Capability | What it is | Real-world use | Cost |
|---|---|---|---|
| **Quaternions** | 4-component numbers that encode 3-D rotation without gimbal lock | Spacecraft and drone attitude, game engines, robotics, IMU sensor fusion | `M` |
| **4-D rotations & projection** | Rotate in 4-D, project to 3-D then 2-D | Tesseract visualisation, spacetime intuition, 4-D data | `M` |
| **Stereographic projection** | Map a sphere to a plane from a pole | Cartography, complex analysis, crystallography | `E` |
| **Geometric (Clifford) algebra** | Unified framework subsuming vectors, complex numbers and quaternions | Robotics, computer vision, EM theory, physics simulation | `XH` |
| **Spinors** | Objects needing a 720° turn to return to start | Quantum mechanics, particle physics | `XH` |
| **Minkowski spacetime** | 4-D geometry with a signed time dimension | Special relativity, light cones, particle collisions | `M` |

---

## J. Probability and statistics

*Desmos is already strong here — build only what's genuinely missing.*

| Capability | What it is | Real-world use | Cost |
|---|---|---|---|
| **Random walks & Brownian motion** | Cumulative random steps | Stock prices, diffusion, particle transport | `E` |
| **Monte Carlo simulation** | Estimate by random sampling | Risk analysis, integration in high dimensions, physics | `E` |
| **Markov chains** | State transitions with memoryless probability | Queueing, PageRank, weather models, reliability | `M` |
| **Stochastic differential equations** | ODEs with a noise term | Options pricing (Black–Scholes), noisy control systems, neuroscience | `H` |
| **Bayesian inference** | Update beliefs from evidence | Medical diagnostics, spam filtering, parameter estimation | `H` |
| **Bootstrap / resampling** | Confidence intervals without distributional assumptions | Robust statistics on small or messy samples | `M` |

---

## K. Numerical methods (the machinery under everything)

| Capability | What it is | Real-world use | Cost |
|---|---|---|---|
| ★ **Root finding** | Newton, Brent, bisection with guaranteed bracketing | Solve anything that has no closed form | `E` |
| ★ **Adaptive quadrature** | Integration with an error bound you can trust | Honest definite integrals | `E` |
| ★ **Interval arithmetic** | Rigorous bounds rather than point estimates | Artefact-free implicit plots; provable enclosures | `M` |
| ★ **Automatic differentiation** | Exact derivatives from the expression tree | Feeds optimisation, stiff solvers, sensitivity, extrema | `M` |
| **Optimisation** | Gradient descent, BFGS, Nelder–Mead, constrained | Fitting, design optimisation, machine learning, logistics | `M` |
| **Linear programming / simplex** | Optimise a linear objective under linear constraints | Scheduling, resource allocation, diet and blending problems | `M` |
| **Interpolation & splines** | Smooth curves through data points | Animation, CAD, data smoothing, font outlines | `E` |
| **Arbitrary-precision arithmetic** | Hundreds of digits when doubles aren't enough | Ill-conditioned problems, number theory, verification | `M` |

---

## L. Discrete mathematics and number theory

| Capability | What it is | Real-world use | Cost |
|---|---|---|---|
| **Primes & factorisation** | Sieves, primality tests, factor trees | Cryptography (RSA), hashing, random number generation | `E` |
| **Modular arithmetic** | Clock arithmetic, inverses, CRT | Cryptography, checksums, calendar and scheduling maths | `E` |
| **Combinatorics** | Permutations, combinations, partitions, generating functions | Probability, algorithm counting, experiment design | `E` |
| **Graph theory** | Networks, shortest paths, flows, colouring, spectra | Routing, social networks, circuit layout, dependency resolution | `M` |
| **Cellular automata** | Grid systems evolving by local rules | Traffic modelling, crystal growth, Conway's Life, procedural generation | `E` |
| **Group theory & symmetry** | Cayley tables and graphs, permutation and rotation groups | Crystallography, particle physics, Rubik's cube, error-correcting codes | `M` |

---

## M. Plot and visualisation types

| Type | What it shows | Cost |
|---|---|---|
| ★ **Contour lines** | Level curves of f(x,y) at multiple heights — reuses existing marching squares | `E` |
| ★ **Filled contour / heatmap** | Colour-mapped scalar field | `E` |
| ★ **Quiver (vector field)** | Arrows showing direction and magnitude | `E` |
| ★ **Streamplot** | Continuous flow lines instead of arrows | `M` |
| ★ **Slope field** | Tangent segments for a first-order ODE | `E` |
| ★ **Phase portrait** | Trajectories in state space | `M` |
| ★ **Domain colouring** | Complex function as a colour image | `M` |
| **3-D surface / parametric surface** | z=f(x,y) and (u,v)-parameterised shapes | `M` |
| **Density / scatter / histogram** | Data distribution | `E` |
| **Log and semi-log axes** | Power laws and exponentials as straight lines | `E` |
| **Polar / cylindrical / spherical** | Natural coordinates for rotational problems | `E` |
| **Riemann surface view** | Multi-sheeted complex domain in 3-D | `XH` |

---

## Recommended first cut

Given calculus · ODEs/physics · linear algebra/data, and holding to "Desmos + Tier 1":

**Phase 1 — highest value per unit of work**
Limits · infinite sums and products with convergence acceleration · Taylor series · symbolic derivative ·
gradient/divergence/curl/Laplacian · adaptive quadrature · root finding · autodiff · interval arithmetic ·
contour lines · filled contour · quiver · slope field

**Phase 2 — the headline features**
RK45 and stiff ODE solvers · systems of ODEs · phase portraits · nullclines and fixed-point classification ·
full matrix type · eigenvalues/eigenvectors · SVD · least squares · linear transformation visualiser ·
complex plane view · domain colouring

**Phase 3 — depth**
Symbolic integration (delegated CAS) · Fourier series and FFT · Laplace transform · transfer functions
and Bode plots · convolution · matrix exponential · multiple integrals · parametric surfaces ·
quaternions · inertia and stress tensors

**Deliberately later**
Riemann surfaces · Christoffel symbols and curvature tensors · Clifford algebra · spinors · PDE solvers ·
analytic continuation · Jordan forms — all `XH`, and none of them blocks anything else.
