"""
Seed Loan Application Data
This script populates the database with sample loan applications
Can be run standalone or as part of the startup process
"""
from generate_sample_data import generate_sample_applications
import sys

def main():
    """
    Main function to seed loan application data
    """
    # Default to 50 applications, or accept command line argument
    count = 50
    if len(sys.argv) > 1:
        try:
            count = int(sys.argv[1])
        except ValueError:
            print("Usage: python seed_loan_data.py [number_of_applications]")
            print("Using default value of 50 applications")
    
    print(f"\n{'='*60}")
    print(f"Starting Loan Application Data Seeding Process")
    print(f"Generating {count} sample applications...")
    print(f"{'='*60}\n")
    
    try:
        generate_sample_applications(count)
        print("\n✅ Loan data seeding completed successfully!")
        return 0
    except Exception as e:
        print(f"\n❌ Error during loan data seeding: {str(e)}")
        return 1

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)