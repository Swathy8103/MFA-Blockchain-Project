// /client/js/signup.js

document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('image-upload');
    const uploadedImagesDiv = document.getElementById('uploaded-images');
    const selectedOrderDiv = document.getElementById('selected-order');
    const imageOrderInput = document.getElementById('imageOrder');
    let selectedImages = [];

    imageUpload.addEventListener('change', (event) => {
        uploadedImagesDiv.innerHTML = '';
        selectedImages = [];
        selectedOrderDiv.innerHTML = '';
        imageOrderInput.value = '';

        const files = event.target.files;
        if (files.length !== 9) {
            alert('Please upload exactly 9 images.');
            imageUpload.value = '';
            return;
        }

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.dataset.index = i;
                img.addEventListener('click', () => {
                    if (img.classList.contains('selected')) {
                        img.classList.remove('selected');
                        const indexToRemove = selectedImages.indexOf(parseInt(img.dataset.index));
                        if (indexToRemove > -1) {
                            selectedImages.splice(indexToRemove, 1);
                        }
                    } else {
                        if (selectedImages.length >= 3) {
                            alert('You can only select 3 images.');
                            return;
                        }
                        img.classList.add('selected');
                        selectedImages.push(parseInt(img.dataset.index));
                    }
                    updateSelectedOrder();
                });
                uploadedImagesDiv.appendChild(img);
            };

            reader.readAsDataURL(file);
        }
    });

    function updateSelectedOrder() {
        selectedOrderDiv.innerHTML = '';
        selectedImages.forEach((index, i) => {
            const span = document.createElement('span');
            span.textContent = `Image ${i + 1}`;
            selectedOrderDiv.appendChild(span);
        });
        imageOrderInput.value = selectedImages.join(',');
    }

    const signupForm = document.getElementById('signup-form');
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (selectedImages.length !== 3) {
            alert('Please select exactly 3 images in the desired order.');
            return;
        }

        const formData = new FormData(signupForm);
        // Append selected image indices as imageOrder
        formData.set('imageOrder', imageOrderInput.value.split(',').map(Number));

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Signup successful!');
                window.location.href = 'login.html';
            } else {
                const errorData = await response.json();
                alert(`Signup failed: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error during signup:', error);
            alert('An error occurred during signup. Please try again.');
        }
    });
});
