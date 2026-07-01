const user = JSON.parse(localStorage.getItem('user') || '{}');

if (user.isAdmin) {
    document.getElementById('adminIconBtn').style.display = 'flex';
}
