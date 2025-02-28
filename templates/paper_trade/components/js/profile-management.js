// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize form handler
    const createProfileForm = document.getElementById('create-profile-form');
    if (createProfileForm) {
        createProfileForm.addEventListener('submit', handleProfileSubmission);
    }
});

// Modal management functions
function showCreateProfileModal() {
    document.getElementById('create-profile-modal').showModal();
}

function closeModal(modalId) {
    document.getElementById(modalId).close();
}

// Form submission handler
async function handleProfileSubmission(e) {
    e.preventDefault();
    const formData = new FormData(this);
    
    try {
        const response = await fetch('/paper-trade/create-profile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: formData.get('name'),
                margin: parseFloat(formData.get('margin'))
            })
        });

        if (response.ok) {
            const data = await response.json();
            showToast(data.message, 'success');
            setTimeout(() => {
                window.location.href = '/paper-trade/dashboard';
            }, 1000);
        } else {
            const data = await response.json();
            showToast(data.message || 'Failed to create profile', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('An error occurred while creating the profile', 'error');
    }
}

async function deleteProfile(profileId) {
    if (confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
        try {
            const response = await fetch(`/api/paper-trade/profiles/${profileId}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                location.reload();
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to delete profile');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while deleting the profile');
        }
    }
}

async function resetProfile(profileId) {
    if (confirm('Are you sure you want to reset this profile? All positions will be closed and margin will be reset.')) {
        try {
            const response = await fetch(`/api/paper-trade/profiles/${profileId}/reset`, {
                method: 'POST',
            });
            if (response.ok) {
                location.reload();
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to reset profile');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while resetting the profile');
        }
    }
}