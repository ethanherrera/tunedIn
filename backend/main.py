from fastapi import FastAPI, HTTPException, Query, Depends
from typing import List, Dict, Any, Optional
import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv
import json
import base64
import datetime

app = FastAPI()

# Load environment variables
load_dotenv()


# Firebase Admin SDK initialization
def initialize_firebase():
    """Initialize Firebase Admin SDK if not already initialized."""
    if not firebase_admin._apps:
        # Check if credentials are provided as base64 string
        if os.getenv("FIREBASE_CREDENTIALS_BASE64"):
            # Decode base64 credentials
            cred_json = base64.b64decode(os.getenv("FIREBASE_CREDENTIALS_BASE64")).decode('utf-8')
            cred_dict = json.loads(cred_json)
            cred = credentials.Certificate(cred_dict)
        else:
            # Use individual environment variables
            cred = credentials.Certificate({
                "type": os.getenv("FIREBASE_TYPE"),
                "project_id": os.getenv("FIREBASE_PROJECT_ID"),
                "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
                "private_key": os.getenv("FIREBASE_PRIVATE_KEY").replace("\\n", "\n"),
                "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                "auth_uri": os.getenv("FIREBASE_AUTH_URI"),
                "token_uri": os.getenv("FIREBASE_TOKEN_URI"),
                "auth_provider_x509_cert_url": os.getenv("FIREBASE_AUTH_PROVIDER_X509_CERT_URL"),
                "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_X509_CERT_URL"),
                "universe_domain": os.getenv("FIREBASE_UNIVERSE_DOMAIN", "googleapis.com")
            })

        # Initialize app with credentials
        firebase_admin.initialize_app(cred)

    # Return Firestore client
    return firestore.client()


# Dependency to get Firestore client
def get_firestore():
    """Dependency to get Firestore client."""
    return initialize_firebase()


def convert_to_serializable(obj):
    """Convert Firestore types to JSON serializable types."""
    if isinstance(obj, datetime.datetime):
        return obj.isoformat()
    elif isinstance(obj, firestore.DocumentReference):
        return str(obj.path)
    return obj


@app.get("/")
async def root():
    return {"message": "Firestore API is running"}


@app.get("/collections/{collection_name}", response_model=List[Dict[str, Any]])
async def get_collection(
        collection_name: str,
        limit: Optional[int] = Query(100, gt=0, le=1000),
        offset: Optional[int] = Query(0, ge=0),
        order_by: Optional[str] = None,
        order_dir: Optional[str] = Query("asc", regex="^(asc|desc)$"),
        db: firestore.Client = Depends(get_firestore)
):
    """
    Get all documents from a Firestore collection.

    Parameters:
    - collection_name: Name of the Firestore collection
    - limit: Maximum number of documents to return (default: 100, max: 1000)
    - offset: Number of documents to skip (default: 0)
    - order_by: Field to order results by (optional)
    - order_dir: Direction to order results (asc or desc, default: asc)

    Returns:
    - List of documents with ID included in each document
    """
    try:
        # Reference to the collection
        collection_ref = db.collection(collection_name)

        # Apply ordering if specified
        if order_by:
            direction = firestore.Query.ASCENDING if order_dir == "asc" else firestore.Query.DESCENDING
            collection_ref = collection_ref.order_by(order_by, direction=direction)

        # Get documents with pagination
        docs = collection_ref.limit(limit).offset(offset).get()

        # Format documents for response
        result = []
        for doc in docs:
            doc_dict = doc.to_dict()
            doc_dict['id'] = doc.id  # Include document ID

            # Convert non-serializable types
            serializable_dict = {}
            for key, value in doc_dict.items():
                serializable_dict[key] = convert_to_serializable(value)

            result.append(serializable_dict)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching collection: {str(e)}")


@app.get("/collections/{collection_name}/{document_id}")
async def get_document(
        collection_name: str,
        document_id: str,
        db: firestore.Client = Depends(get_firestore)
):
    """
    Get a single document from a Firestore collection by ID.

    Parameters:
    - collection_name: Name of the Firestore collection
    - document_id: ID of the document to retrieve

    Returns:
    - Document data with ID included
    """
    try:
        doc_ref = db.collection(collection_name).document(document_id)
        doc = doc_ref.get()

        if not doc.exists:
            raise HTTPException(status_code=404, detail=f"Document not found: {document_id}")

        doc_dict = doc.to_dict()
        doc_dict['id'] = doc.id  # Include document ID

        # Convert non-serializable types
        serializable_dict = {}
        for key, value in doc_dict.items():
            serializable_dict[key] = convert_to_serializable(value)

        return serializable_dict

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching document: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    debug = os.getenv("DEBUG", "False").lower() == "true"

    uvicorn.run("main:app", host=host, port=port, reload=debug)