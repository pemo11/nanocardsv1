document.addEventListener('DOMContentLoaded', () => {
    // API-Endpunkt
    // const API_URL = 'http://localhost:8000';
    const API_URL = 'https://nanocardsv1-q6y8f.ondigitalocean.app';
    // DOM-Elemente
    const fileUpload = document.getElementById('file-upload');
    const fileName = document.getElementById('file-name');
    const uploadButton = document.getElementById('upload-button');
    const uploadSection = document.getElementById('upload-section');
    const setSelection = document.getElementById('set-selection');
    const setsList = document.getElementById('sets-list');
    const flashcardSection = document.getElementById('flashcard-section');
    const setTitle = document.getElementById('set-title');
    const question = document.getElementById('question');
    const answer = document.getElementById('answer');
    const cardCounter = document.getElementById('card-counter');
    const cardCounterBack = document.getElementById('card-counter-back');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const backToSetsBtn = document.getElementById('back-to-sets');
    const flashcard = document.querySelector('.flashcard');
    const progress = document.getElementById('progress');
    
    // State
    let currentSetId = null;
    let currentSet = null;
    let currentCardIndex = 0;
    
    // Datei-Upload-Handling
    fileUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            fileName.textContent = file.name;
            uploadButton.disabled = false;
            uploadButton.classList.remove('bg-gray-200', 'text-gray-500', 'cursor-not-allowed');
            uploadButton.classList.add('bg-indigo-600', 'hover:bg-indigo-700', 'text-white');
        }
    });
    
    // Upload-Button-Click
    uploadButton.addEventListener('click', async () => {
        const file = fileUpload.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            uploadButton.textContent = 'Wird hochgeladen...';
            uploadButton.disabled = true;
            
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                alert(`Set erfolgreich hochgeladen! ${data.count} Karten hinzugefügt.`);
                fileUpload.value = '';
                fileName.textContent = '';
                uploadButton.textContent = 'Hochladen';
                uploadButton.disabled = true;
                uploadButton.classList.add('bg-gray-200', 'text-gray-500', 'cursor-not-allowed');
                uploadButton.classList.remove('bg-indigo-600', 'hover:bg-indigo-700', 'text-white');
                
                // Sets neu laden
                loadSets();
            } else {
                alert(`Fehler: ${data.detail}`);
                uploadButton.textContent = 'Hochladen';
                uploadButton.disabled = false;
            }
        } catch (error) {
            alert('Es ist ein Fehler aufgetreten. Bitte versuche es erneut.');
            console.error(error);
            uploadButton.textContent = 'Hochladen';
            uploadButton.disabled = false;
        }
    });
    
    // Sets laden
    async function loadSets() {
        try {
            const response = await fetch(`${API_URL}/sets`);
            const sets = await response.json();
            
            setsList.innerHTML = '';
            
            if (sets.length === 0) {
                setsList.innerHTML = '<p class="text-gray-500">Keine Sets gefunden.</p>';
                return;
            }
            
            sets.forEach(set => {
                const setItem = document.createElement('div');
                setItem.className = 'p-3 bg-indigo-50 hover:bg-indigo-100 rounded cursor-pointer transition duration-300';
                setItem.innerHTML = `
                    <div class="flex justify-between items-center">
                        <h3 class="font-medium">${set.name}</h3>
                        <span class="text-sm text-gray-500">${set.count} Karten</span>
                    </div>
                `;
                
                setItem.addEventListener('click', () => loadSet(set.id));
                setsList.appendChild(setItem);
            });
            
            uploadSection.classList.add('hidden');
            setSelection.classList.remove('hidden');
            
        } catch (error) {
            console.error('Fehler beim Laden der Sets:', error);
        }
    }
    
    // Set laden
    async function loadSet(setId) {
        try {
            const response = await fetch(`${API_URL}/sets/${setId}`);
            const setData = await response.json();
            
            currentSetId = setId;
            currentSet = setData;
            currentCardIndex = 0;
            
            setTitle.textContent = setData.name;
            updateCardDisplay();
            
            setSelection.classList.add('hidden');
            flashcardSection.classList.remove('hidden');
            
        } catch (error) {
            console.error('Fehler beim Laden des Sets:', error);
        }
    }
    
    // Karten-Anzeige aktualisieren
    function updateCardDisplay() {
        if (!currentSet || currentSet.cards.length === 0) return;
        
        const card = currentSet.cards[currentCardIndex];
        question.textContent = card.question;
        answer.textContent = card.answer;
        
        const counterText = `${currentCardIndex + 1} / ${currentSet.cards.length}`;
        cardCounter.textContent = counterText;
        cardCounterBack.textContent = counterText;
        
        // Progress-Bar aktualisieren
        const progressPercentage = ((currentCardIndex + 1) / currentSet.cards.length) * 100;
        progress.style.width = `${progressPercentage}%`;
        
        // Buttons aktivieren/deaktivieren
        prevBtn.disabled = currentCardIndex === 0;
        prevBtn.classList.toggle('opacity-50', currentCardIndex === 0);
        
        // Karte zurücksetzen (Frage zeigen)
        flashcard.classList.remove('flipped');
    }
    
    // Karte umdrehen (Klick-Event)
    flashcard.addEventListener('click', () => {
        flashcard.classList.toggle('flipped');
    });
    
    // Nächste Karte
    nextBtn.addEventListener('click', () => {
        if (!currentSet) return;
        
        if (flashcard.classList.contains('flipped')) {
            // Wenn die Karte umgedreht ist, drehe sie zurück und gehe zur nächsten
            flashcard.classList.remove('flipped');
            
            // Kurze Verzögerung für Animation
            setTimeout(() => {
                if (currentCardIndex < currentSet.cards.length - 1) {
                    currentCardIndex++;
                    updateCardDisplay();
                }
            }, 300);
        } else {
            // Wenn die Karte nicht umgedreht ist, drehe sie um
            flashcard.classList.add('flipped');
        }
    });
    
    // Vorherige Karte
    prevBtn.addEventListener('click', () => {
        if (!currentSet || currentCardIndex === 0) return;
        
        flashcard.classList.remove('flipped');
        
        // Kurze Verzögerung für Animation
        setTimeout(() => {
            currentCardIndex--;
            updateCardDisplay();
        }, 300);
    });
    
    // Zurück zur Set-Auswahl
    backToSetsBtn.addEventListener('click', () => {
        flashcardSection.classList.add('hidden');
        setSelection.classList.remove('hidden');
        
        // Sets neu laden
        loadSets();
    });
    
    // Initial Sets laden
    loadSets();
});