function toggleQuoteEdit() {
    const quoteForm = document.getElementById('quote-form');
    const editButton = document.getElementById('edit-quote-button');
    if (quoteForm.style.display === 'none' || quoteForm.style.display === '') {
        quoteForm.style.display = 'flex';
        editButton.style.display = 'none';
    } else {
        quoteForm.style.display = 'none';
        editButton.style.display = 'block';
    }
}
