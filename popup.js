// Initialize toggle switch with stored visibility preference
document.addEventListener('DOMContentLoaded', function() {
    const toggle = document.getElementById('visibilityToggle');
    const statusMessage = document.getElementById('statusMessage');
  
    // Get current tab to check if we're on Edugate
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentUrl = tabs[0].url;
      const isOnEdugate = currentUrl.includes('edugate.psu.edu.sa');
      
      if (!isOnEdugate) {
        statusMessage.textContent = 'This extension only works on edugate.psu.edu.sa';
        statusMessage.style.color = '#dc3545';
        toggle.disabled = true;
        return;
      }
  
      // Load saved visibility preference
      chrome.storage.sync.get(['dinoEduVisible'], function(result) {
        // Default to visible if preference not set
        const visible = result.dinoEduVisible === undefined ? true : result.dinoEduVisible;
        toggle.checked = visible;
        
        updateStatusMessage(visible);
      });
  
      // Add event listener to toggle
      toggle.addEventListener('change', function() {
        const isVisible = toggle.checked;
        
        // Save preference
        chrome.storage.sync.set({dinoEduVisible: isVisible}, function() {
          console.log('Visibility preference saved: ' + isVisible);
        });
        
        // Send message to content script to toggle visibility
        chrome.tabs.sendMessage(tabs[0].id, {action: "toggleVisibility"}, function(response) {
          if (response && response.success) {
            updateStatusMessage(isVisible);
          }
        });
      });
    });
  
    function updateStatusMessage(isVisible) {
      if (isVisible) {
        statusMessage.textContent = 'Search interface is visible';
        statusMessage.style.color = '#28a745';
      } else {
        statusMessage.textContent = 'Search interface is hidden';
        statusMessage.style.color = '#666';
      }
    }
  });