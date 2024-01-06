class City {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    distanceTo(otherCity) {
        const dx = this.x - otherCity.x;
        const dy = this.y - otherCity.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

class Route {
    constructor(cities) {
        this.cities = cities;
        this.distance = this.calculateDistance();
    }

    calculateDistance() {
        let totalDistance = 0;
        for (let i = 0; i < this.cities.length - 1; i++) {
            totalDistance += this.cities[i].distanceTo(this.cities[i + 1]);
        }
        // Add distance from the last city back to the starting city
        totalDistance += this.cities[this.cities.length - 1].distanceTo(this.cities[0]);
        return totalDistance;
    }

    static crossover(parent1, parent2) {
        // Perform crossover to create a new route
        const start = Math.floor(Math.random() * parent1.cities.length);
        const end = Math.floor(Math.random() * (parent1.cities.length - start)) + start;
        const childCities = [...parent1.cities.slice(start, end + 1)];

        // Add remaining cities from parent2 to child
        for (let city of parent2.cities) {
            if (!childCities.includes(city)) {
                childCities.push(city);
            }
        }

        return new Route(childCities);
    }

    mutate() {
        // Swap two random cities to introduce mutation
        const index1 = Math.floor(Math.random() * this.cities.length);
        let index2 = Math.floor(Math.random() * this.cities.length);
        
        // Ensure index2 is different from index1
        while (index2 === index1) {
            index2 = Math.floor(Math.random() * this.cities.length);
        }

        // Swap the cities
        [this.cities[index1], this.cities[index2]] = [this.cities[index2], this.cities[index1]];

        // Recalculate distance after mutation
        this.distance = this.calculateDistance();
    }
}

class GeneticAlgorithm {
    constructor(populationSize, cities) {
        this.populationSize = populationSize;
        this.cities = cities;
        this.population = this.initializePopulation();
        this.generation = 0;
        this.maxGenerations = 1000;
        this.stagnationThreshold = 100; // Number of generations with no improvement to consider as stagnation
        this.bestFitness = this.population[0].distance;
        this.stagnationCounter = 0;
    }

    initializePopulation() {
        const population = [];
        for (let i = 0; i < this.populationSize; i++) {
            const shuffledCities = [...this.cities];
            // Shuffle the array to create a random route
            for (let j = shuffledCities.length - 1; j > 0; j--) {
                const randomIndex = Math.floor(Math.random() * (j + 1));
                [shuffledCities[j], shuffledCities[randomIndex]] = [shuffledCities[randomIndex], shuffledCities[j]];
            }
            population.push(new Route(shuffledCities));
        }
        return population;
    }

    evolve() {
        // Sort the population by route distance
        this.population.sort((a, b) => a.distance - b.distance);

        // Perform crossover and mutation to create a new generation
        const newGeneration = [this.population[0]]; // Keep the best route from the previous generation

        for (let i = 1; i < this.population.length; i++) {
            const parent1 = this.population[i - 1];
            const parent2 = this.population[i];

            // Perform crossover
            const child = Route.crossover(parent1, parent2);

            // Perform mutation
            if (Math.random() < 0.1) {
                child.mutate();
            }

            newGeneration.push(child);
        }

        this.population = newGeneration;
        this.generation++;
    }

    getBestRoute() {
        // Sort the population and return the best route
        this.population.sort((a, b) => a.distance - b.distance);
        return this.population[0];
    }

    isStagnant() {
        const currentBestFitness = this.population[0].distance;

        if (currentBestFitness < this.bestFitness) {
            // If the fitness has improved, reset the counter and update the best fitness
            this.bestFitness = currentBestFitness;
            this.stagnationCounter = 0;
        } else {
            // If the fitness has not improved, increment the counter
            this.stagnationCounter++;
        }

        return this.stagnationCounter >= this.stagnationThreshold;
    }

    reset() {
        this.generation = 0;
        this.stagnationCounter = 0;
        this.bestFitness = Infinity;
        this.population = this.initializePopulation();
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    const numCities = 10;
    const cities = generateRandomLocations(numCities, canvas.width, canvas.height);

    const crossoverRateInput = document.getElementById("crossoverRate");
    const mutationRateInput = document.getElementById("mutationRate");
    const maxGenerationsInput = document.getElementById("maxGenerations");
    const startButton = document.getElementById("startButton");
    const pauseButton = document.getElementById("pauseButton");
    const outputTextArea = document.getElementById("output");

    let isEvolutionRunning = false;

    function generateRandomLocations(numCities, maxWidth, maxHeight) {
        let cities = [];
        for (let i = 0; i < numCities; i++) {
            cities.push(new City(Math.random() * maxWidth, Math.random() * maxHeight));
        }
        return cities;
    }

    const geneticAlgorithm = new GeneticAlgorithm(50, cities);

    function drawCities() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        cities.forEach(city => {
            ctx.beginPath();
            ctx.arc(city.x, city.y, 8, 0, 2 * Math.PI);
            ctx.fillStyle = "red";
            ctx.fill();
            ctx.stroke();
        });
    }

    function drawRoute(route) {
        ctx.beginPath();
        ctx.moveTo(route.cities[0].x, route.cities[0].y);
        for (let i = 1; i < route.cities.length; i++) {
            ctx.lineTo(route.cities[i].x, route.cities[i].y);
        }
        ctx.lineTo(route.cities[0].x, route.cities[0].y);
        ctx.strokeStyle = "blue";
        ctx.stroke();
    }

    function updateOutput(message) {
        outputTextArea.value += message + "\n";
        outputTextArea.scrollTop = outputTextArea.scrollHeight;
    }

    function animateEvolution() {
        if (isEvolutionRunning) {
            drawCities();

            // Set crossover, mutation rates, and max generations
            geneticAlgorithm.crossoverRate = parseFloat(crossoverRateInput.value);
            geneticAlgorithm.mutationRate = parseFloat(mutationRateInput.value);
            geneticAlgorithm.maxGenerations = parseInt(maxGenerationsInput.value, 1000);

            // Evolve the population
            geneticAlgorithm.evolve();

            // Get the best route from the current generation
            const bestRoute = geneticAlgorithm.getBestRoute();

            // Draw the best route
            drawRoute(bestRoute);

            // Update output
            updateOutput(`Generation ${geneticAlgorithm.generation}: Best Distance - ${bestRoute.distance.toFixed(2)}`);

            // Check termination criteria
            if (geneticAlgorithm.generation >= geneticAlgorithm.maxGenerations || geneticAlgorithm.isStagnant()) {
                pauseEvolution();
                if (geneticAlgorithm.isStagnant()) {
                    updateOutput("Evolution stopped due to fitness stagnation.");
                } else {
                    updateOutput("Evolution stopped after reaching the maximum number of generations.");
                }
            } else {
                // Repeat the animation
                requestAnimationFrame(animateEvolution);
            }
        }
    }

    function startEvolution() {
        isEvolutionRunning = true;
        startButton.disabled = true;
        pauseButton.disabled = false;
        geneticAlgorithm.reset();
        animateEvolution();
    }

    function pauseEvolution() {
        isEvolutionRunning = false;
        startButton.disabled = false;
        pauseButton.disabled = true;
    }

    startButton.addEventListener("click", startEvolution);
    pauseButton.addEventListener("click", pauseEvolution);
});
