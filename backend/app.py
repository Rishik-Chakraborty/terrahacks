import google.generativeai as genai
import PIL.Image
import os

class SimpleTextExtractor:
    def __init__(self, api_key: str):
        # Set up the Gemini API connection
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
    
    def extract_all_text(self, image_path: str) -> str:
        # Read text from prescription image
        try:
            image = PIL.Image.open(image_path)
            
            # Tell the AI what we want
            prompt = """Extract all text from this prescription image. 
            Get everything you can see - names, dates, numbers, addresses, everything.
            Just return the text, no extra formatting."""
            
            response = self.model.generate_content([prompt, image])
            return response.text.strip()
            
        except FileNotFoundError:
            return "ERROR: Can't find the image file"
        except Exception as e:
            return f"ERROR: Something went wrong - {str(e)}"
    
    def find_specific_info(self, all_text: str, what_to_find: str) -> str:
        # Look for specific information in the extracted text
        try:
            prompt = f"""Look through this prescription text and find the {what_to_find}.
            
            Text from prescription:
            {all_text}
            
            Just give me the {what_to_find}, nothing else."""
            
            response = self.model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            return f"ERROR: {str(e)}"

def main():
    # Put your API key here
    API_KEY = "AIzaSyB9vu3unqqhMrKEk_EnDSvizk6XT8C4lMQ"
    
    # Create the text extractor
    extractor = SimpleTextExtractor(API_KEY)
    
    # Where your prescription image is located
    image_path = r"C:\Users\Kavir\Downloads\Vivaan.jpg"
    
    print("Reading prescription image...")
    
    # First, get everything from the image
    all_text = extractor.extract_all_text(image_path)
    
    print("=== EVERYTHING FROM THE PRESCRIPTION ===")
    print(all_text)
    print("\n" + "="*50 + "\n")
    
    # Now pull out the important stuff
    print("=== KEY INFORMATION ===")
    
    patient_name = extractor.find_specific_info(all_text, "patient name")
    print(f"Patient: {patient_name}")
    
    medication = extractor.find_specific_info(all_text, "medication name and strength")
    print(f"Medicine: {medication}")
    
    doctor = extractor.find_specific_info(all_text, "doctor's name")
    print(f"Doctor: {doctor}")
    
    expiry = extractor.find_specific_info(all_text, "expiry date")
    print(f"Expires: {expiry}")
    
    instructions = extractor.find_specific_info(all_text, "how to use this medication")
    print(f"How to use: {instructions}")
    
    # Save everything to a text file
    with open("prescription_info.txt", "w") as f:
        f.write("PRESCRIPTION SCAN RESULTS\n")
        f.write("=" * 25 + "\n\n")
        f.write("FULL TEXT:\n")
        f.write(all_text)
        f.write(f"\n\nKEY INFO:\n")
        f.write(f"Patient: {patient_name}\n")
        f.write(f"Medicine: {medication}\n")
        f.write(f"Doctor: {doctor}\n")
        f.write(f"Expires: {expiry}\n")
        f.write(f"Instructions: {instructions}\n")
    
    print(f"\nSaved results to prescription_info.txt")

if __name__ == "__main__":
    main()