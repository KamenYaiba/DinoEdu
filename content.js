// Check for visibility preference
chrome.storage.sync.get(['dinoEduVisible'], function(result) {
  // default to invisible if preference not set
  const visible = result.dinoEduVisible === undefined ? true : result.dinoEduVisible;
  
  // create and inject the search UI with initial invisibility
  createSearchUI(visible);
});

// listen for visibility toggle messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "toggleVisibility") {
    const searchContainer = document.getElementById('section-search-container');
    if (searchContainer) {
      if (searchContainer.style.display === 'none') {
        searchContainer.style.display = 'block';
      } else {
        searchContainer.style.display = 'none';
      }
    }
    sendResponse({success: true});
  }
});

function createSearchUI(visible) {
  // prevent duplicates
  if (document.getElementById('section-search-container')) {
    console.log('Course search UI already exists');
    return;
  }

  // search UI container with forced LTR direction for consistency across arabic and english pages
  const container = document.createElement('div');
  container.id = 'section-search-container';
  container.style.padding = '20px';
  container.style.background = 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)';
  container.style.border = 'none';
  container.style.borderRadius = '12px';
  container.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
  container.style.margin = '15px';
  container.style.fontFamily = '"Segoe UI", Roboto, Arial, sans-serif';
  container.style.direction = 'ltr';
  container.style.textAlign = 'left';
  container.style.color = '#333';
  
  // initial visibility based on preference
  container.style.display = visible ? 'block' : 'none';

  container.innerHTML = `
    <h1 style="text-align: center; color: #3a7bd5; margin-bottom: 20px; font-size: 28px; font-weight: 700;">DinoEdu - Human-Usable Edugate 🦕</h1>
    <div id="searchControls" style="display: flex; flex-wrap: wrap; gap: 15px; align-items: flex-start;">
      <div style="display: flex; flex: 2; min-width: 300px; flex-direction: column;">
        <label style="margin-bottom: 8px; font-weight: 600; color: #555;">Course:</label>
        <select id="courseCodeSelect" style="padding: 10px; border-radius: 8px; border: 1px solid #ddd; background: white; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1); font-size: 14px; width: 100%;">
          <option value="">All Courses</option>
          <!-- Course options will be populated dynamically -->
        </select>
      </div>
      
      <div style="display: flex; flex: 1; min-width: 300px; flex-direction: column;">
        <label style="margin-bottom: 8px; font-weight: 600; color: #555;">Instructor:</label>
        <select id="instructorSelect" style="padding: 10px; border-radius: 8px; border: 1px solid #ddd; background: white; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1); font-size: 14px; width: 100%;">
          <option value="">All Instructors</option>
          <!-- Instructor options will be populated dynamically -->
        </select>
      </div>
      
      <div style="display: flex; flex: 1; min-width: 300px; flex-direction: column;">
        <label style="margin-bottom: 8px; font-weight: 600; color: #555;">Time:</label>
        <div style="display: flex; gap: 8px;">
          <select id="hourSelect" style="padding: 10px; border-radius: 8px; border: 1px solid #ddd; background: white; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1); font-size: 14px; flex: 2;">
            <option value="">Any Hour</option>
            ${Array.from({length: 12}, (_, i) => i + 1).map(hour => 
              `<option value="${hour.toString().padStart(2, '0')}">${hour.toString().padStart(2, '0')}</option>`
            ).join('')}
          </select>
          <select id="periodSelect" style="padding: 10px; border-radius: 8px; border: 1px solid #ddd; background: white; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1); font-size: 14px; flex: 1;">
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>
      
      <div style="display: flex; flex: 0.5; min-width: 120px; flex-direction: column;">
        <label style="margin-bottom: 8px; font-weight: 600; color: #555;">Credit Hours:</label>
        <select id="creditHoursSelect" style="padding: 10px; border-radius: 8px; border: 1px solid #ddd; background: white; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1); font-size: 14px; width: 100%;">
          <option value="">Any</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
          <option value="6">6</option>
        </select>
      </div>
    </div>
    
    <div style="display: flex; gap: 15px; margin-top: 20px; align-items: center; flex-wrap: wrap;">
      <button id="searchButton" style="padding: 12px 24px; background: linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        Search Sections
      </button>
      
      <div style="display: flex; gap: 20px; flex-wrap: wrap; align-items: center;">
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="checkbox" id="includeLectureOnly" style="margin-right: 8px; width: 16px; height: 16px;"> 
          <span>Include non-lecture sections</span>
        </label>
        
        <label style="display: flex; align-items: center; cursor: pointer;">
          <input type="checkbox" id="includeClosedSections" style="margin-right: 8px; width: 16px; height: 16px;"> 
          <span>Include closed sections</span>
        </label>
      </div>
    </div>
    
    <div id="resultsContainer" style="margin-top: 25px; margin-bottom: 30px;"></div>    `;

  // footer
  const footer = document.createElement('div');
  footer.id = 'dino-edu-footer';
  footer.style.marginTop = '30px';
  footer.style.textAlign = 'center';
  footer.style.padding = '5px 12px';
  footer.style.background = 'rgba(58, 123, 213, 0.9)';
  footer.style.color = 'white';
  footer.style.borderRadius = '8px 8px 0 0';
  footer.style.fontSize = '12px';
  footer.style.boxShadow = '0 -2px 5px rgba(0,0,0,0.1)';
  footer.style.zIndex = '1000';
  footer.innerHTML = 'DinoEdu v2.5.0 • by mio 🦕';

  document.body.prepend(container);
  container.appendChild(footer);

  const searchButton = document.getElementById('searchButton');
  searchButton.addEventListener('mouseover', () => {
    searchButton.style.transform = 'translateY(-2px)';
    searchButton.style.boxShadow = '0 6px 8px rgba(0,0,0,0.15)';
  });
  searchButton.addEventListener('mouseout', () => {
    searchButton.style.transform = 'translateY(0)';
    searchButton.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  });


  let allCourses = [];
  let uniqueCourses = new Map(); // Map to store unique course codes with their titles
  let uniqueInstructors = new Set(); // Set to store unique instructors

  const targetUrl = window.location.origin + "/psu/ui/student/offeredCourses/index/offeredCoursesIndex.faces";

  fetch(targetUrl)
    .then(response => response.text())
    .then(data => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data, 'text/html');

      // Find the specific table by ID
      const table = doc.querySelector('table#myForm\\:offeredCoursesTable');
      
      if (!table) {
        document.getElementById('resultsContainer').innerText = 'Target table not found.';
        return;
      }

      const tbody = table.querySelector('tbody');
      
      if (!tbody) {
        document.getElementById('resultsContainer').innerText = 'No data found in the table.';
        return;
      }

      // fetch all sections - rest of the code remains the same
      const rows = tbody.querySelectorAll('tr.ROW1, tr.ROW2');

      allCourses = Array.from(rows).map((row, index) => {
        const tds = row.querySelectorAll('td');
        const html = row.innerHTML;
        const instructorMatch = html.match(/instructor" value="(.*?)"/);
        const sectionMatch = html.match(/section" value="(.*?)"/);
        
        const code = tds[0]?.textContent.trim();
        const name = tds[1]?.textContent.trim();
        const instructor = instructorMatch ? instructorMatch[1].trim() : '';
        
        // Extract credit hours (now at index 4)
        const creditHours = tds[4]?.textContent.trim() || " ";
        
        if (code && name) {
          uniqueCourses.set(code, name);
        }
        
        if (instructor) {
          uniqueInstructors.add(instructor);
        }
        
        // extract days and time
        let daysAndTime = '';
        if (sectionMatch && sectionMatch[1]) {
          // english: U M T W Th (Sun, Mon, Tue, Wed, Thu)
          // arabic: ح ثن ثل ر خ  (أحد، اثنين، ثلاثاء، أربعاء، خميس)
          // AM/PM and ص/م time formats
          
          // english regex
          const englishPattern = /([UMWThFRS\s]+)@t\s+([\d:]+\s+[AP]M\s+-\s+[\d:]+\s+[AP]M)/g;
          
          // arabic regex
          const arabicPattern = /([حثنرثلخجس\s]+)@t\s+([\d:]+\s+[صم]\s+-\s+[\d:]+\s+[صم])/g;
          
          let matches = [];
          
          const englishMatches = [...sectionMatch[1].matchAll(englishPattern)];
          if (englishMatches.length > 0) {
            matches = englishMatches;
          } else {
            const arabicMatches = [...sectionMatch[1].matchAll(arabicPattern)];
            if (arabicMatches.length > 0) {
              matches = arabicMatches;
            }
          }
          
          if (matches.length > 0) {
            daysAndTime = matches.map(match => {
              const days = match[1].trim();
              const time = match[2].trim();
              return `${days} ${time}`;
            }).join('<br>');
          }
        }

        return {
          id: index,
          code: code,
          name: name,
          section: tds[2]?.textContent.trim(),
          type: tds[3]?.textContent.trim(),
          creditHours: creditHours,
          status: tds[5]?.textContent.trim(),
          instructor: instructor,
          time: daysAndTime,
          // save raw time info for search purposes
          rawTimes: extractTimeInfo(daysAndTime)
        };
      });
      
      populateCourseDropdown();
      
      populateInstructorDropdown();
      
    })
    .catch(error => {
      console.error('Fetch error:', error);
      document.getElementById('resultsContainer').innerHTML = 
      "<span style='color: red; font-weight: bold;'>Error loading section data. Please make sure you're signed in</span>";

    });
    
  function populateCourseDropdown() {
    const dropdown = document.getElementById('courseCodeSelect');
    
    // convert Map to array and sort by course code
    const sortedCourses = Array.from(uniqueCourses.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    sortedCourses.forEach(([code, name]) => {
      const option = document.createElement('option');
      option.value = code;
      option.textContent = `${code} - ${name}`;
      dropdown.appendChild(option);
    });
  }
  
  function populateInstructorDropdown() {
    const dropdown = document.getElementById('instructorSelect');
    
    // convert Set to array and sort alphabetically
    const sortedInstructors = Array.from(uniqueInstructors).sort();
    
    sortedInstructors.forEach(instructor => {
      if (instructor) { // Only add non-empty instructor names
        const option = document.createElement('option');
        option.value = instructor;
        option.textContent = instructor;
        dropdown.appendChild(option);
      }
    });
  }

  // Helper function to extract time info from the days and time text
  function extractTimeInfo(daysAndTimeText) {
    if (!daysAndTimeText) return [];
    
    const times = [];
    const lines = daysAndTimeText.split('<br>');
    
    lines.forEach(line => {
      // get starting hour with period (AM/PM or ص/م)
      const timeMatch = line.match(/([\d:]+)\s+([APصم]M|[صم])/);
      if (timeMatch) {
        times.push({
          timeString: timeMatch[1],
          period: timeMatch[2]
        });
      }
    });
    
    return times;
  }

  // handle the copy button click
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      // temporary success message
      const messageId = 'copy-success-message';
      let message = document.getElementById(messageId);
      
      if (!message) {
        message = document.createElement('div');
        message.id = messageId;
        message.style.position = 'fixed';
        message.style.bottom = '20px';
        message.style.right = '20px';
        message.style.padding = '10px 15px';
        message.style.background = '#28a745';
        message.style.color = 'white';
        message.style.borderRadius = '5px';
        message.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        message.style.zIndex = '10000';
        message.style.transition = 'opacity 0.5s ease-in-out';
        document.body.appendChild(message);
      }
      
      message.textContent = `Section ${text} copied!`;
      message.style.opacity = '1';
      
      // hide  message after 2 seconds
      setTimeout(() => {
        message.style.opacity = '0';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }

  function displayResults(courses) {
    const container = document.getElementById('resultsContainer');
    if (!courses.length) {
      container.innerHTML = '<div style="text-align: center; padding: 20px; color: #666; font-style: italic;">No matching sections found</div>';
      return;
    }

    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'separate';
    table.style.borderSpacing = '0';
    table.style.direction = 'ltr'; // Ensure table is always LTR
    table.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    table.style.borderRadius = '8px';
    table.style.overflow = 'hidden';
    table.style.marginTop = '10px';
    
    table.innerHTML = `
      <thead>
        <tr style="background: linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%); color: white;">
          <th style="padding: 12px 15px; text-align: left; font-weight: 600;">Course Code</th>
          <th style="padding: 12px 15px; text-align: left; font-weight: 600;">Course Name</th>
          <th style="padding: 12px 15px; text-align: left; font-weight: 600;">Instructor</th>
          <th style="padding: 12px 15px; text-align: left; font-weight: 600;">Section</th>
          <th style="padding: 12px 15px; text-align: left; font-weight: 600;">Status</th>
          <th style="padding: 12px 15px; text-align: left; font-weight: 600;">Type</th>
          <th style="padding: 12px 15px; text-align: left; font-weight: 600;">Credits</th>
          <th style="padding: 12px 15px; text-align: left; font-weight: 600;">Days & Time</th>
        </tr>
      </thead>
      <tbody>
        ${courses.map((course, index) => `
          <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f5f7fa'}; border-bottom: 1px solid #eee; transition: background 0.2s;">
            <td style="padding: 12px 15px;">${course.code}</td>
            <td style="padding: 12px 15px;">${course.name}</td>
            <td style="padding: 12px 15px;">${course.instructor}</td>
            <td style="padding: 12px 15px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>${course.section}</span>
                <button 
                  class="copy-btn" 
                  data-section="${course.section}" 
                  style="padding: 3px 8px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 12px; transition: all 0.2s;">
                  Copy
                </button>
              </div>
            </td>
            <td style="padding: 12px 15px; color: ${course.status.toLowerCase().includes('open') || course.status.toLowerCase().includes('مفتوحة') ? '#28a745' : '#dc3545'};">${course.status}</td>
            <td style="padding: 12px 15px;">${course.type}</td>
            <td style="padding: 12px 15px;">${course.creditHours}</td>
            <td style="padding: 12px 15px;">${course.time}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    
    container.innerHTML = '';
    container.appendChild(table);
    
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      row.addEventListener('mouseover', () => {
        row.style.backgroundColor = '#e6f7ff';
      });
      row.addEventListener('mouseout', () => {
        const rowIndex = Array.from(row.parentNode.children).indexOf(row);
        row.style.backgroundColor = rowIndex % 2 === 0 ? '#ffffff' : '#f5f7fa';
      });
    });
    
    // event listeners to all copy buttons
    const copyButtons = table.querySelectorAll('.copy-btn');
    copyButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent row hover effect trigger
        const sectionNumber = button.getAttribute('data-section');
        copyToClipboard(sectionNumber);
        
        const originalBackground = button.style.background;
        const originalText = button.textContent;
        
        button.style.background = '#28a745';
        button.style.color = 'white';
        button.textContent = 'Copied!';
        
        setTimeout(() => {
          button.style.background = originalBackground;
          button.style.color = '';
          button.textContent = originalText;
        }, 1000);
      });
      
      button.addEventListener('mouseover', () => {
        button.style.background = '#e0e0e0';
      });
      button.addEventListener('mouseout', () => {
        if (button.textContent !== 'Copied!') {
          button.style.background = '#f0f0f0';
        }
      });
    });
  }

  document.getElementById('searchButton').addEventListener('click', () => {
    // get search criteria
    const selectedCourseCode = document.getElementById('courseCodeSelect').value;
    const selectedInstructor = document.getElementById('instructorSelect').value;
    const hourValue = document.getElementById('hourSelect').value;
    const periodValue = document.getElementById('periodSelect').value;
    const creditHoursValue = document.getElementById('creditHoursSelect').value;
    
    // get filter options
    const includeLectureOnly = document.getElementById('includeLectureOnly').checked;
    const includeClosedSections = document.getElementById('includeClosedSections').checked;
    
    // filter courses based on combined criteria
    let filtered = allCourses.filter(course => {
      // apply course code filter if provided
      if (selectedCourseCode && course.code !== selectedCourseCode) {
        return false;
      }
      
      // apply instructor filter if provided
      if (selectedInstructor && course.instructor !== selectedInstructor) {
        return false;
      }
      
      // apply credit hours filter if provided
      if (creditHoursValue && course.creditHours.trim() !== creditHoursValue) {
        return false;
      }
      
      // apply time filter if both hour and period are provided
      if (hourValue && periodValue) {
        const hasMatchingTime = course.rawTimes.some(time => {
          const timeHour = time.timeString.split(':')[0].padStart(2, '0');
          
          if (timeHour !== hourValue) return false;
          
          const periodMatches = (
            (periodValue === 'AM' && (time.period === 'AM' || time.period === 'ص')) || 
            (periodValue === 'PM' && (time.period === 'PM' || time.period === 'م'))
          );
          
          return periodMatches;
        });
        
        if (!hasMatchingTime) return false;
      }
      
      return true;
    });

    // lecture-only filter
    if (!includeLectureOnly) {
      filtered = filtered.filter(course => {
        const type = course.type.toLowerCase();
        return type === "lecture" || type === "محاضرات";
      });
    }

    // closed sections filter
    if (!includeClosedSections) {
      filtered = filtered.filter(course => {
        const status = course.status.toLowerCase();
        return status === "opened" || status === "مفتوحة";
      });
    }

    displayResults(filtered);
  });
}