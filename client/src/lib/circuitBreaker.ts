// Circuit Breaker Pattern - Like Facebook's
interface CircuitBreakerState {
    status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failureCount: number;
    lastFailureTime: number;
    threshold: number;
    timeout: number;
}

class CircuitBreaker {
    private state: CircuitBreakerState = {
        status: 'CLOSED',
        failureCount: 0,
        lastFailureTime: 0,
        threshold: 5,      // Fail 5 times before opening
        timeout: 60000     // Wait 1 minute before trying again
    };

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        if (this.state.status === 'OPEN') {
            if (this.shouldAttemptReset()) {
                this.state.status = 'HALF_OPEN';
                console.log('🔄 Circuit breaker: HALF_OPEN - testing connection');
            } else {
                throw new Error('Circuit breaker is OPEN - service unavailable');
            }
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess(): void {
        this.state.failureCount = 0;
        this.state.status = 'CLOSED';
        console.log('✅ Circuit breaker: CLOSED - service working normally');
    }

    private onFailure(): void {
        this.state.failureCount++;
        this.state.lastFailureTime = Date.now();

        if (this.state.failureCount >= this.state.threshold) {
            this.state.status = 'OPEN';
            console.log('🚨 Circuit breaker: OPEN - service failing, using fallback');
        }
    }

    private shouldAttemptReset(): boolean {
        return Date.now() - this.state.lastFailureTime > this.state.timeout;
    }

    // Force reset (for admin use)
    forceReset(): void {
        this.state.status = 'CLOSED';
        this.state.failureCount = 0;
        console.log('🔧 Circuit breaker: Force reset');
    }

    // Get current status
    getStatus(): CircuitBreakerState {
        return { ...this.state };
    }
}

// Global circuit breakers for different services
export const socketCircuitBreaker = new CircuitBreaker();
export const apiCircuitBreaker = new CircuitBreaker();

// Usage example:
// try {
//     const result = await socketCircuitBreaker.execute(() => 
//         socketService.connect()
//     );
// } catch (error) {
//     // Use fallback or cached data
//     useOfflineMode();
// } 