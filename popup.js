// Initialize button with user's preferred color
let countAllVideosLengthButton = document.getElementById('countAllVideosLength')
// When the button is clicked, inject setPageBackgroundColor into current page
countAllVideosLengthButton.addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: countAllVideosLength
  })
})

function countAllVideosLength () {
  const timeStringToSecondsNumber = timeString => {
    const [s = 0, m = 0, h = 0] = timeString.split(':').reverse()
    return +s + m * 60 + +h * 3600
  }
  const getTotalDuration = () => {
    // playlist:
    // '.playlist-items .ytd-thumbnail-overlay-time-status-renderer'

    // all videos:
    // '#text.style-scope.ytd-thumbnail-overlay-time-status-renderer'

    return [
      ...document.querySelectorAll(
        '#text.style-scope.ytd-thumbnail-overlay-time-status-renderer'
      )
    ]
      .map(elem => elem.innerText)
      .filter(elem => elem)
      .reduce((prev, item) => {
        return prev + timeStringToSecondsNumber(item)
      }, 0)
  }

  const channelTable = () => {
    return [...document.querySelectorAll('ytd-grid-video-renderer')].map(
      elem => {
        const { innerText: title } = elem.querySelector('#video-title')
        const { innerText: time } = elem.querySelector(
          '#text.ytd-thumbnail-overlay-time-status-renderer'
        )
        return { title, time: time.trim() }
      }
    )
  }

  const scrollDown = new Promise((resolve, reject) => {
    let scrollPositionOld = 0
    let samePositionCounter = 0

    const scrollingElement = document.scrollingElement || document.body

    const intervalId = setInterval(() => {
      const scrollPosition = scrollingElement.scrollHeight
      scrollingElement.scrollTop = scrollPosition

      if (scrollPosition === scrollPositionOld) {
        samePositionCounter++
      } else {
        scrollPositionOld = scrollPosition
      }

      if (samePositionCounter === 2) {
        clearInterval(intervalId)
        resolve(true)
      }
    }, 2000)
  })

  const secondsNumberToTimeString = secNum => {
    const h = Math.floor(secNum / 3600)
    const m = Math.floor((secNum - h * 3600) / 60)
    const s = secNum - h * 3600 - m * 60
    return `${h}:${m}:${s}`
  }

  scrollDown.then(() => {
    console.log('all readed!!!')

    const totalDuration = getTotalDuration()

    console.log(totalDuration)
    const tableOfContent = channelTable()
    console.log(tableOfContent)

    const tableRows = tableOfContent.reduce((prev, item, index) => {
      const { title, time /*string*/ } = item

      const timeSecondsNumber = timeStringToSecondsNumber(time)

      return (
        prev +
        `<tr>
        <td>${index + 1}</td>
        <td>${title}</td>
        <td>${time}</td>
        <td>${timeSecondsNumber}</td>
        <td>
        <div style="height:10px; width:${timeSecondsNumber /
          20}px; background: green;"></div>
          </td>
        </tr>`
      )
    }, '')

    const tableHTML = `<div class="ytdChannelInfoBlock">
    <div class="controlsAndInfoBlock">
        <button id="showHideTable">show/hide table of content</button>
        <p>total duration: ${secondsNumberToTimeString(totalDuration)}</p>
    </div>
    <table class="contentTable">
        <thead>
            <tr>
                <th>n</th>
                <th>title</th>
                <th>time</th>
                <th>sec</th>
                <th>diagram</th>
            </tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>
    </div>
    <style>
        .controlsAndInfoBlock {
            position: absolute;
            top:2px;
            right: 2px;
            z-index: 20;
        }
        .ytdChannelInfoBlock {
            position: absolute;
            z-index: 9999;
            background: white;
            width: 100%;
        }
    </style>
    `

    const tableElem = document.createElement('div')
    tableElem.innerHTML = tableHTML

    document.body.appendChild(tableElem)

    const scrollingElement = document.scrollingElement || document.body

    scrollingElement.scrollTop = 0

    // document.querySelector('ytd-app').style.display = 'none' // otherwise main app hide our table

    document.querySelector('#showHideTable').addEventListener('click', () => {
      if (document.querySelector('.contentTable').style.display === 'none') {
        document.querySelector('.contentTable').style.display = 'block'
        document.querySelector('ytd-app').style.visibility = 'hide'
      } else {
        document.querySelector('.contentTable').style.display = 'none'
        document.querySelector('ytd-app').style.visibility = 'show'
      }
    })
  })
}
