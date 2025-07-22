import logging
import time
from functools import wraps
from typing import Callable, TypeVar, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Type variable for generic function return type
T = TypeVar('T')

class PoseDetectionError(Exception):
    """Base exception for pose detection errors."""
    pass

class LowConfidenceError(PoseDetectionError):
    """Raised when pose detection confidence is too low."""
    pass

class InvalidFrameError(PoseDetectionError):
    """Raised when frame data is invalid or corrupted."""
    pass

class NoLandmarksDetectedError(PoseDetectionError):
    """Raised when no landmarks could be detected."""
    pass

class ProcessingTimeoutError(PoseDetectionError):
    """Raised when processing takes too long."""
    pass

def exponential_backoff(
    max_retries: int = 3,
    base_delay: float = 0.1,
    max_delay: float = 2.0,
    exceptions: tuple = (PoseDetectionError,)
) -> Callable:
    """
    Decorator that implements exponential backoff retry logic.
    
    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Initial delay between retries in seconds
        max_delay: Maximum delay between retries in seconds
        exceptions: Tuple of exceptions to catch and retry
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            retries = 0
            while True:
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    retries += 1
                    if retries > max_retries:
                        logger.error(f"Max retries ({max_retries}) exceeded. Error: {str(e)}")
                        raise
                        
                    # Calculate delay with exponential backoff
                    delay = min(base_delay * (2 ** (retries - 1)), max_delay)
                    
                    logger.warning(
                        f"Attempt {retries}/{max_retries} failed. "
                        f"Retrying in {delay:.2f}s. Error: {str(e)}"
                    )
                    
                    time.sleep(delay)
        return wrapper
    return decorator

def fallback_enabled(fallback_func: Callable[..., T]) -> Callable[..., T]:
    """
    Decorator that enables fallback mode when the main function fails.
    
    Args:
        fallback_func: Function to call as fallback
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            try:
                return func(*args, **kwargs)
            except Exception as e:
                logger.warning(f"Main function failed, attempting fallback. Error: {str(e)}")
                return fallback_func(*args, **kwargs)
        return wrapper
    return decorator

def log_execution_time(func: Callable[..., T]) -> Callable[..., T]:
    """Decorator that logs function execution time."""
    @wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> T:
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            logger.debug(f"{func.__name__} executed in {execution_time:.2f}s")
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(
                f"{func.__name__} failed after {execution_time:.2f}s. "
                f"Error: {str(e)}"
            )
            raise
    return wrapper 