import urllib.request
import urllib.parse
import urllib.error
import json
import getpass
from datetime import datetime, timedelta

def fetch_oura_data(endpoint, token, params=None):
    base_url = "https://api.ouraring.com/v2/usercollection/"
    url = base_url + endpoint
    
    if params:
        query_string = urllib.parse.urlencode(params)
        url += "?" + query_string

    req = urllib.request.Request(url)
    req.add_header('Authorization', f'Bearer {token}')
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            return data
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP Error {e.code}: {e.reason}"}
    except Exception as e:
        return {"error": str(e)}

def main():
    print("=== Oura API v2 Data Checker ===")
    # getpass hides the token as it is being pasted
    token = getpass.getpass('Paste your Oura Personal Access Token: ')
    
    if not token.strip():
        print("Token cannot be empty.")
        return

    print("\nFetching data... Please wait.\n")
    
    # We will fetch data for the most recent 7 days
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=7)
    
    date_params = {
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": end_date.strftime("%Y-%m-%d")
    }

    # ISO format string for datetime endpoints
    end_dt = datetime.now().strftime("%Y-%m-%dT%H:%M:%S") + "-00:00"
    start_dt = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%S") + "-00:00"

    endpoints = [
        ("Personal Info", "personal_info", None),
        ("Daily Sleep", "daily_sleep", date_params),
        ("Daily Activity", "daily_activity", date_params),
        ("Daily Readiness", "daily_readiness", date_params),
        ("Daily Stress", "daily_stress", date_params),
        ("Daily Resilience", "daily_resilience", date_params),
        ("Sleep", "sleep", date_params),
        ("Tag", "tag", date_params),
        ("Workout", "workout", date_params),
        ("Sessions", "session", date_params),
        ("Heart Rate (Last 24h)", "heartrate", {"start_datetime": start_dt, "end_datetime": end_dt})
    ]

    for name, endpoint, params in endpoints:
        print(f"--- Checking {name} ---")
        data = fetch_oura_data(endpoint, token, params)
        
        if "error" in data:
            print(f"❌ Failed to fetch: {data['error']}")
            # If we get a 401 Unauthorized, the token is likely invalid.
            if "401" in data['error'] or "403" in data['error']:
                print("Your token might be invalid or missing the required scopes.")
                if name == "Personal Info":
                    print("Stopping further checks due to authentication error.")
                    break
        else:
            # Handle standard collections (which return a 'data' array)
            if 'data' in data:
                items = data['data']
                print(f"✅ Successfully retrieved {len(items)} records.")
                
                # Print a small snippet of the first record found to prove it works
                if items:
                    sample = json.dumps(items[0], indent=2)
                    if len(sample) > 300:
                        sample = sample[:300] + "\n  ... [truncated for brevity]"
                    print("Sample data:")
                    print(sample)
            else:
                # Endpoints like personal_info that just return an object directly
                print("✅ Successfully retrieved data.")
                print(json.dumps(data, indent=2))
        print("\n")

if __name__ == "__main__":
    main()
