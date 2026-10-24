import sys

from dotenv import load_dotenv
import mysql.connector

from app import db_connection

load_dotenv()


def main():
    if len(sys.argv) != 2:
        print("Usage: python make_admin.py person@college.edu")
        return 1
    email = sys.argv[1].strip().lower()
    connection = db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute("UPDATE users SET role = 'admin' WHERE email = %s", (email,))
        connection.commit()
        if not cursor.rowcount:
            print("No account found. Register that email first, then run this command.")
            return 1
        print(f"Admin access granted to {email}. Sign out and sign in again.")
        return 0
    except mysql.connector.Error as exc:
        print(f"Could not update account role: {exc}")
        return 1
    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    raise SystemExit(main())
