// /client/js/login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const imageSelectionDiv = document.getElementById('image-selection');
    let images = [];
    let selectedImages = [];

    // Fetch user's images (you need to implement the backend route to get images)
    async function fetchUserImages(username) {
        try {
            const response = await fetch(`/api/auth/getUserImages?username=${encodeURIComponent(username)}`);
            if (response.ok) {
                const data = await response.json();
                return data.images; // Array of image URLs or paths
            } else {
                alert('Failed to fetch user images.');
                return [];
            }
        } catch (error) {
            console.error('Error fetching images:', error);
            return [];
        }
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const username = formData.get('username');

        images = await fetchUserImages(username);
        if (images.length !== 9) {
            alert('User images not found or incomplete.');
            return;
        }

        // Shuffle images
        const shuffledImages = shuffleArray([...images]);

        // Display shuffled images for selection
        imageSelectionDiv.innerHTML = '';
        selectedImages = [];
        shuffledImages.forEach((imgSrc, index) => {
            const img = document.createElement('img');
            img.src = imgSrc;
            img.dataset.index = index;
            img.addEventListener('click', () => {
                if (img.classList.contains('selected')) {
                    img.classList.remove('selected');
                    const indexToRemove = selectedImages.indexOf(index);
                    if (indexToRemove > -1) {
                        selectedImages.splice(indexToRemove, 1);
                    }
                } else {
                    if (selectedImages.length >= 3) {
                        alert('You can only select 3 images.');
                        return;
                    }
                    img.classList.add('selected');
                    selectedImages.push(index);
                }
            });
            imageSelectionDiv.appendChild(img);
        });

        // Prompt user to submit after selecting images
        if (selectedImages.length === 3) {
            const pin = formData.get('pin');
            const imageSelection = selectedImages;

            // Send login request
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, pin, imageSelection })
                });

                if (response.ok) {
                    const data = await response.json();
                    alert('Login successful!');
                    // Handle successful login (e.g., redirect to dashboard)
                } else {
                    const errorData = await response.json();
                    alert(`Login failed: ${errorData.message}`);
                }
            } catch (error) {
                console.error('Error during login:', error);
                alert('An error occurred during login. Please try again.');
            }
        }
    });

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
});
