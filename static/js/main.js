let calon = []
let aspirasi = []

const periodDataHit = 15

const topboard = document.querySelector('#top_board')
const sideboard = document.querySelector('#side_board')
const leaderboard = document.querySelector('#leaderboard-fn')

const ls_aspirasi = document.querySelector('#list-aspirasi')
const colAspirasi = document.querySelector('#objNode_aspirasi')

const welcome = document.getElementById('welcome')
const voter = document.getElementById('voter')
const fade = document.getElementById('fade')
const applause = new Audio("static/audio/applause.mp3")
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
let db = false;
window.addEventListener('click', () => {
    const music_bg = document.getElementById('music');
    music_bg.play();
}, {once : true})

// Mobile Error
// window.onerror = function (message, source, lineno, colno, error) {
//     alert("ERROR: " + message + "\nAt: " + source + ":" + lineno);
//     return false;
// };
// window.onunhandledrejection = function (event) {
//     alert("PROMISE ERROR: " + event.reason);
// };

let visitorId = localStorage.getItem('visitor_uuid');
let isVisited = false
let isAlreadyVoted = false
// localStorage.removeItem('isAlreadyVoted');

if (!visitorId) {
    // First time visit
    visitorId = 'abracdabra';
    localStorage.setItem('visitor_uuid', visitorId);
    localStorage.setItem('isAlreadyVoted', false);
} else {
    // Returning visit
    isVisited = true
}

if (localStorage.getItem('isAlreadyVoted')) {
    isAlreadyVoted = true
} 

// console.log(isAlreadyVoted)

function addSwitchListener(btn) {
    btn.onclick = function() {
        if (db) { return }
        db = true;
        if (btn.dataset.to) {
            document.querySelectorAll('.toppage').forEach((e) => {
                if (e.id !== btn.dataset.to) {
                    e.style.opacity = 0
                    setTimeout(() => {
                        e.style.display = 'none' 
                        db = false;
                    }, 500);
                } else {
                    setTimeout(() => {
                        e.style.opacity = 0
                        e.style.display = 'flex'
                        
                        setTimeout(() => {
                            e.style.opacity = 1 
                            db = false;
                        }, 100)
                    }, 500);
                }
            })
        }
        if (btn.dataset.fn) {
            if (window[btn.dataset.fn]) {
                window[btn.dataset.fn]()
            }
        }
    }
}

function addBackListener(btn) {
    btn.addEventListener('click', () => {
        if (db) {return}
        db = true;
        if (btn.closest('.toppage')) {
            const toppage = btn.closest('.toppage')
            toppage.style.opacity = 0
            setTimeout(() => {
                toppage.style.display = 'none'
                welcome.style.display = 'flex'
                welcome.style.opacity = 1
                db = false;
            }, 500);
        }
    })
}

function pull(e) {
    return document.querySelector(e)
}

async function backend_get(data, dir) {
    const response = await fetch(dir, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    return response.json()
}

const SUPABASE_URL = 'https://alvpctfjbqkwzufaguab.supabase.co/rest/v1'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdnBjdGZqYnFrd3p1ZmFndWFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5NjkxMTksImV4cCI6MjA5MjU0NTExOX0.C-PelnmiVRBZ_XkgEBKzzunZIWmf8m5Rs1WJweF4Vrw'

async function postToSupabase(rpc, req) {
    const response = await fetch(SUPABASE_URL + `/rpc/${rpc}`, {
        method: 'POST',
        headers: {
            'apikey' : SUPABASE_KEY,
            'Authorization' : `Bearer ${SUPABASE_KEY}`,
            'Content-Type' : 'application/json',
        },
        body: JSON.stringify(req)
    })
    const data = await response.json();
    return data;
}

async function getTable(table) {
    const response = await fetch(SUPABASE_URL + `/${table}`, {
        method: 'GET',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
        },
    })
    const data = await response.json();
    return data;
}

async function updateSqlData() {
    // calon = await backend_get({action: 'get_calon'}, '/api/sql')
    calon = await getTable('calon_osis');
    aspirasi = await getTable('aspiratif')
}

async function showLeaderboard() {
    // await updateSqlData()
    // console.log(calon)
    leaderboard.innerHTML = ''

    let toFixedArray = {}

    let sampletop = topboard.cloneNode(true)
    leaderboard.appendChild(sampletop)

    table_calon = calon

    table_calon.sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));

    for (let i = 0; i < table_calon.length ; i++) {
        const data = table_calon[i]
        let sampleside = sideboard.cloneNode(true)
        toFixedArray[data.nama_siswa] = data.total_voted
        sampleside.querySelector('.abc-1').innerText = "=> " + data.nama_siswa
        sampleside.querySelector('.abc-2').innerText = data.total_voted
        sampleside.querySelector('.abc-3').querySelector('.abcd-1').addEventListener('click', () => {
            openVote(data.nama_siswa)
        })
        sampleside.querySelector('.abc-3').querySelector('.abcd-2').addEventListener('click', () => {
            showAspirasi(data.nama_siswa)
        })

        leaderboard.append(sampleside)
    }

    const names = Object.keys(toFixedArray)
    const values = Object.values(toFixedArray)
    new Chart(document.getElementById('myChart'), {
        type: 'pie',
        data: {
            labels: names, // ['Marketing', 'Sales', 'R&D', 'Support']
            datasets: [{
                data: values, // [1200, 2500, 600, 300]
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#aa4b89', '##e5c7a3']
            }],
            borderWidth:0,
            hoverOffset:0
        },
        options: {
}            plugins: {
                tooltip: {
                    // This ensures when you hover, you see "Name: Value"
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            let value = context.parsed;
                            return `${label}: ${value}`;
                        }
                    }
                }
            }
        }
    });
    
}

async function showAspirasi(calon) {
    // await updateSqlData()
    if (!calon) {return}
    ls_aspirasi.innerHTML = ''

    for (let i = 0; i < aspirasi.length; i++) {
        const data = aspirasi[i]

        if (data.calon === calon) {
            let sampleside = colAspirasi.cloneNode(true)
            sampleside.querySelector('.basic-text').innerText = `" ${data.aspirasi} "`
            ls_aspirasi.appendChild(sampleside)
        }

    }

    if (aspirasi.length === 0) {
        let sampleside = colAspirasi.cloneNode(true)
        sampleside.style.height = '100%'
        sampleside.querySelector('.basic-text').innerText = 'Tidak ada aspirasi.'
        sampleside.querySelector('.basic-text').style.textAlign = 'center'
        sampleside.querySelector('.basic-text').style.fontSize = '6cqw'
        ls_aspirasi.appendChild(sampleside)
    }

    ls_aspirasi.parentElement.style.display = 'flex'
}

function openVote(calon) {
    if (isAlreadyVoted) {return}
    if (calon.length >= 1) {
        voter.querySelector('#to-name').innerText = 'to ' + calon
        voter.querySelector('#aspirasi-field').value = ''
        voter.dataset.calon = calon

        fade.style.opacity = 0
        fade.style.display = 'flex'
        voter.style.opacity = 0
        voter.style.display = 'flex'
        setTimeout(() => {
            voter.style.opacity = 1
            fade.style.opacity = 0.5
        }, 500);
    }
}

let lock = false
function commitVote() {
    if (voter.dataset.calon !== undefined) {
        if (lock) {return}
        lock = true
        const calon = voter.dataset.calon
        const aspirasi = voter.querySelector('#aspirasi-field').value
        console.log(calon, aspirasi)
        voter.style.opacity = 0
        fade.style.opacity = 0
        setTimeout(() => {
            voter.style.display = 'none'
            fade.style.display = 'none'
        }, 500);

        // Send to backend via python pqsql //

        // backend_get( {
        //     action : 'add_vote_calon',
        //     calon : calon,
        //     aspirasi : aspirasi
        // }, '/api/sql')

        // Send to backend via supabase //

        postToSupabase("vote", { "target": calon })
        postToSupabase("postaspirasi", { "target": calon, "teraspirasi" : aspirasi})

        localStorage.setItem('isAlreadyVoted', true)
        isAlreadyVoted = true;
        closeVote();

        setTimeout(() => {
            showLeaderboard();
        }, 5001);
        setTimeout(() => {
            lock = false
        }, 1000)

        updateSqlData()
    }
}

const voteSample = document.getElementById('vote_splash').cloneNode(true);
function voteDrop(name) {
    if (name === "") {return}
    name = name.split(" ")[0];
    const s = voteSample.cloneNode(true);
    s.querySelector('.basic-text').innerText = name
    
    document.getElementById('rain_container').append(s)
    const x = Math.random() * window.innerWidth;

    // Random fall duration between 1s and 3s
    const duration = Math.random() * 1000 + 2500;

    s.style.left = `${x}px`;

    // Animate from top to bottom
    const animation = s.animate([
        { transform: 'translateY(0) rotate(0)' },
        { transform: `translateY(${window.innerHeight + 150}px) rotate(360deg)` }
    ], {
        duration: duration,
        easing: 'linear'
    });

    // Remove the element once the fall is finished to save memory
    animation.onfinish = () => s.remove();
}
// voteRain('basilea')
async function rainsVotes(n, name) {
    if (n && name) {
        if (n > 48) { n = 48 }
        for (let i = 0; i < n; i++) {
            setTimeout(() => {
                voteDrop(name)
            }, Math.random() * 3000);
        }
    }
}

const show_media_img = document.getElementById('media-img')
const show_media = document.getElementById('media-player')
const show_name_displayer = document.getElementById('show_name_displayer')
const show_numbervoted_displayer = document.getElementById('show_numbervoted_displayer')

function showStats(name, numberofvotes) {
    applause.pause();
    applause.currentTime = 0

    show_media_img.style.display = 'none'

    show_media.style.opacity = 0
    show_media.style.display = 'flex'

    show_name_displayer.style.opacity = 0
    show_name_displayer.style.display = 'flex'

    show_numbervoted_displayer.style.opacity = 0
    show_numbervoted_displayer.style.display = 'flex'

    show_name_displayer.querySelector('.basic-text').innerText = ''
    show_numbervoted_displayer.querySelector('.total').innerText = numberofvotes

    show_numbervoted_displayer.style.transform = 'scale(0)'
    show_numbervoted_displayer.style.opacity = 0

    rainsVotes(numberofvotes, name)
    applause.play();

    setTimeout(() => {
        show_media.style.opacity = 1
        show_name_displayer.style.opacity = 1
        show_numbervoted_displayer.style.opacity = 1

        typeJS(function (str) { show_name_displayer.querySelector('.basic-text').innerText = str }, name)
    }, 500);

    setTimeout(() => {
        show_media.style.transform = 'translateX(15vw)'
        show_numbervoted_displayer.style.transform = 'scale(1) translateX(-15vw)'
    }, 2000);

    setTimeout(() => {
        show_media.style.opacity = 0
        show_name_displayer.style.opacity = 0
        show_numbervoted_displayer.style.opacity = 0

        show_media_img.querySelector('img').style.transform = 'translateX(0vw)'
        show_numbervoted_displayer.style.transform = 'scale(0) translateX(0vw)'

    }, 4000);

}

async function typeJS(callback, full) {
    if (callback && full) {
        const len = full.length
        for (let i = 0; i < len ; i++) {
            callback(full.substring(0, i + 1))
            await delay(75)
        }
    }
}

function showStatsImg(name, numberofvotes) {
    applause.pause();
    applause.currentTime = 0

    const callName = name.split(" ")[0];
    show_media_img.querySelector('img').src = `static/img/${callName}.jpeg`
    show_media_img.style.display = 'flex'

    show_media.style.display = 'none'
    
    show_media_img.style.opacity = 0
    show_media_img.style.display = 'flex'

    show_name_displayer.style.opacity = 0
    show_name_displayer.style.display = 'flex'

    show_numbervoted_displayer.style.opacity = 0
    show_numbervoted_displayer.style.display = 'flex'
    show_numbervoted_displayer.style.transform = 'scale(0)'
    show_numbervoted_displayer.style.opacity = 0

    show_name_displayer.querySelector('.basic-text').innerText = ''
    show_numbervoted_displayer.querySelector('.total').innerText = numberofvotes

    rainsVotes(numberofvotes, name)
    applause.play();

    setTimeout(() => {
        show_media_img.style.opacity = 1
        show_name_displayer.style.opacity = 1
        show_numbervoted_displayer.style.opacity = 1
        typeJS(function (str) { show_name_displayer.querySelector('.basic-text').innerText = str}, name)
    }, 500);

    setTimeout(() => {
        show_media_img.querySelector('img').style.transform = 'translateX(15vw)'
        show_numbervoted_displayer.style.transform = 'scale(1) translateX(-15vw)'
    }, 2000);

    setTimeout(() => {
        show_media_img.style.opacity = 0
        show_name_displayer.style.opacity = 0
        show_numbervoted_displayer.style.opacity = 0
        show_media_img.querySelector('img').style.transform = 'translateX(0vw)'
        show_numbervoted_displayer.style.transform = 'scale(0) translateX(0vw)'
    }, 4000);

}

// showStats('Clement Basillea Tomatala', 1051)

async function startFest() {
    fade.style.opacity = 0
    fade.style.display = 'flex'
    // setTimeout(() => {
    fade.style.opacity = 0.5
    //     showStats('Michael Vallentino Siregar', 51)
    // }, 500);

    await delay(500)
    if (table_calon.length !== 0) {
        for (let i = 0; i < table_calon.length; i++) {
            const o = table_calon[i]
            console.log(o.nama_siswa, o.total_voted)
            fade.style.opacity = 0.5
            if (o.nama_siswa.split(" ")[0] === 'Michael') {
                showStats(o.nama_siswa, o.total_voted)
            } else {
                showStatsImg(o.nama_siswa, o.total_voted) // Test only
            }
            await delay(5000)
        }
    }

    await delay(1000)
    window.location.reload()
}

let settedQR = false
async function setQRCode() {
    if (settedQR) {return}
    settedQR = true

    // const data = await backend_get({ 'action': "wlan_ip" }, "/api/info")
    // document.getElementById('wlan-ssid').innerText = data.ssid
    document.getElementById('wlan-ssid').innerText = "VOTE OSIS 2026"

    const el = kjua({
        render: 'svg', // Scalable
        // text: 'http://' + data.ip,
        text: 'https://michaelshouter.github.io/schoolpreview/',
        fill: '#000',
        size: 400,     // Base size
    });
    el.style.width = "100%"
    el.style.height = "100%"
    document.getElementById('web-qrcode').appendChild(el)
}

function onToggleQRView() {
    setQRCode()
    const situation = document.getElementById('admin-qr').style.display === 'none'
    document.getElementById('admin-qr').style.display = situation ? "block" : "none"
    if (situation) {
        document.querySelector('.admin-view').style.backgroundColor = "rgba(50,0,50, 0.5)"
    } else {
        document.querySelector('.admin-view').style.backgroundColor = "rgba(50,0,50, 0)"
    }
}

function onTouchBgToHide(btn) {
    btn.addEventListener('click', () => {
        btn.style.display = 'none'
    })
}

setQRCode()

document.getElementById('qr-code-btn').addEventListener('click', onToggleQRView)
document.querySelectorAll('.switch-page-btn').forEach(addSwitchListener)
document.querySelectorAll('.top-back-btn').forEach(addBackListener)
document.querySelector('#submit-vote').addEventListener('click', commitVote)
document.querySelectorAll('.touch-bg-to-hide').forEach(onTouchBgToHide)

setTimeout(async () => {
    await updateSqlData()
    showLeaderboard()
    // startFest()

    while (true) {
        await updateSqlData()
        await delay(periodDataHit*1000)
    }
}, 1);

// Inited

function closeVote() {
    document.querySelectorAll('.vote-btn-fn-open').forEach((e) => {
        e.style.opacity = 0
        e.style.pointerEvents = 'none'
        e.style.display = 'hidden'
            
        e.parentElement.style.display = 'none'
        e.parentElement.style.opacity = 0
        e.parentElement.style.pointerEvents = 'none'

    })
}

if (isAlreadyVoted) {
    closeVote();
}