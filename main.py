from flask import Flask, jsonify, request
from pathlib import Path
from psycopg2 import extras
import os, psycopg2, asyncio, socket, subprocess, re

sql = [
    'Abed',
    'Avant',
    'Clement',
    'Gabriel',
    'Michael',
    'Nicholas',
]

class Database:
    def __init__(self):
        # Set up your global-like connection here
        try:
            self.conn = psycopg2.connect(
                host="localhost",
                database="VoteOSIS",
                user="postgres",
                password="123"
            )
            # We use a cursor that returns rows as dictionaries (easier to read)
            self.cur = self.conn.cursor(cursor_factory=extras.RealDictCursor)
        except: pass

    def query(self, sql, params=None):
        """Use this for SELECT statements"""
        self.cur.execute(sql, params)
        return self.cur.fetchall()

    def run(self, sql, params=None):
        """Use this for INSERT, UPDATE, DELETE (commits changes)"""
        self.cur.execute(sql, params)
        self.conn.commit()

    def close(self):
        """Close the connection when finished"""
        self.cur.close()
        self.conn.close()

db = Database()

busyUpdate = False

fetched_calon_osis = {}
fetched_aspirasi = {}

root = Path(__file__).parent

def get_windows_ssid():
    try:
        # Run command to show interface details
        results = subprocess.check_output(["netsh", "wlan", "show", "interfaces"], text=True)
        # Search for the SSID line
        ssid_match = re.search(r'SSID\s*:\s*(.*)\n', results)
        if ssid_match:
            return ssid_match.group(1).strip()
        else:
            return "Disconnected"
    except Exception as e:
        return f"Error: {e}"

def render_template(dir):
    with open(root / dir, 'r') as file:
        return file.read()
    
def read_stored_sql():
    if True: return
    with open(root / 'sql/data.txt', 'r') as file:
        return file.read().splitlines()
    
def perform_update_sql():
    global fetched_calon_osis
    global fetched_aspirasi
    
    temp1 = []
    temp2 = []

    data_calon_osis = db.query("select * from calon_osis")
    data_aspirasi = db.query("select * from aspiratif")

    for row in data_calon_osis:
        temp1.append({
            'nama_siswa' : row['nama_siswa'],
            'kelas' : row['kelas'],
            'total_voted' : row['total_voted']
        })

    for row in data_aspirasi:
        temp2.append({
            'aspirasi' : row['aspirasi'],
            'calon' : row['calon']
        })

    fetched_calon_osis = temp1
    fetched_aspirasi = temp2
    # print(temp1)
    # print(temp2)

async def unkeep():
    global busyUpdate
    if not busyUpdate: return True
    asyncio.sleep(5)
    # print('Timeout! available for update!')
    busyUpdate = False

def update_sql():
    global busyUpdate
    # print('Busy : ', busyUpdate)
    if busyUpdate: return True
    busyUpdate = True
    print('Perform Update SQL!')
    perform_update_sql()
    asyncio.run(unkeep())

def read_sql():
    temp = {}
    rawtxt = read_stored_sql()
    for i in range(len(sql)):
        temp[sql[i]] = rawtxt[i]
    return temp

app = Flask(__name__)
app.secret_key = os.urandom(24)

@app.route("/", methods=["GET", "POST"])
def main():
    return render_template('templates/index.html')

@app.route("/api/info", methods=["POST"])
def info():
    action = request.json.get('action')
    
    if action == 'wlan_ip':
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        try:
            # Doesn't actually connect, just probes for the interface used for this route
            s.connect(('8.8.8.8', 80))
            ip = s.getsockname()[0]
        except Exception:
            ip = '127.0.0.1'
        finally:
            s.close()
        return jsonify({"ip":ip, "ssid" : get_windows_ssid()})
    return jsonify({"msg": "error"})

@app.route("/api/sql", methods=["POST"])
def get_sql():
    update_sql()

    action = request.json.get('action')
    
    if action == 'get_calon':
        global fetched_calon_osis
        return jsonify({'data':fetched_calon_osis})
    
    if action == 'get_aspirasi':
        global fetched_aspirasi
        return jsonify({'data':fetched_aspirasi})
    
    if action == 'add_vote_calon' and request.json.get('aspirasi') and request.json.get('calon'):
        calon = request.json.get('calon')
        aspirasi = request.json.get('aspirasi')
        command = """
            UPDATE calon_osis
            SET total_voted = total_voted + 1
            WHERE nama_siswa = %s;

            INSERT INTO aspiratif (aspirasi, calon)
            VALUES
            (%s, %s);

        """
        db.run(command, (calon, aspirasi, calon,))
        print('vote added success')
    
    return jsonify({'data': "success"})

def getting_sql():
    update_sql()

    action = ''
    
    if action == 'get_calon':
        global fetched_calon_osis
        return jsonify({'data':fetched_calon_osis})
    
    if action == 'get_aspirasi':
        global fetched_aspirasi
        return jsonify({'data':fetched_aspirasi})

if __name__ == "__main__":
    # getting_sql()
    # get_sql()
    app.run(host="0.0.0.0", port=80)