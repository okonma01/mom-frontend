"""
Utility functions for interacting with Vercel Blob Storage via REST API
Compatible with Python 3.10+
"""
import os
import json
import requests
from typing import Dict, List, Union, Any
import logging

logger = logging.getLogger(__name__)

class VercelBlobClient:
    """
    Client for interacting with Vercel Blob Storage via REST API
    """
    def __init__(self, token=None):
        """
        Initialize with an optional token (will fall back to environment variable)
        """
        self.token = token or os.environ.get('BLOB_READ_WRITE_TOKEN')
        if not self.token:
            logger.warning("No Vercel Blob token provided, functionality will be limited")
        
        self.api_url = "https://blob.vercel-storage.com"
    
    def is_available(self) -> bool:
        """Check if Vercel Blob is available (token exists)"""
        return bool(self.token)

    def list_blobs(self, prefix: str = None, limit: int = 100) -> List[Dict[str, Any]]:
        """
        List blobs with optional prefix filtering
        
        Args:
            prefix: Optional prefix to filter blobs by
            limit: Maximum number of blobs to return
            
        Returns:
            List of blob objects
        """
        if not self.token:
            logger.error("Cannot list blobs: Missing Vercel Blob token")
            return []
            
        params = {'limit': limit}
        if prefix:
            params['prefix'] = prefix
        
        headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            response = requests.get(
                f"{self.api_url}/",
                headers=headers,
                params=params
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('blobs', [])
            else:
                logger.error(f"Failed to list blobs: {response.status_code} - {response.text}")
                return []
        except Exception as e:
            logger.error(f"Error listing blobs: {str(e)}")
            return []
    
    def put_blob(self, pathname: str, content: Union[str, bytes], 
                content_type: str = "application/json", 
                access: str = "public") -> Dict[str, Any]:
        """
        Upload content to Vercel Blob
        
        Args:
            pathname: Path/filename for the blob
            content: Content to upload (string or bytes)
            content_type: MIME type for the content
            access: 'public' or 'private'
            
        Returns:
            Dictionary with blob information including URL
        """
        if not self.token:
            logger.error("Cannot upload blob: Missing Vercel Blob token")
            return {'error': 'Missing token', 'success': False}
        
        # Convert string content to bytes if needed
        if isinstance(content, str):
            content = content.encode('utf-8')
        
        headers = {
            'Authorization': f'Bearer {self.token}',
            'x-content-type': content_type,
            'x-blob-upload-pathname': pathname,
            'x-blob-access': access
        }
        
        try:
            response = requests.put(
                f"{self.api_url}/",
                headers=headers,
                data=content
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to upload blob: {response.status_code} - {response.text}")
                return {'error': response.text, 'success': False}
        except Exception as e:
            logger.error(f"Error uploading blob: {str(e)}")
            return {'error': str(e), 'success': False}
    
    def get_blob(self, pathname: str, return_bytes: bool = False) -> Union[str, bytes, None]:
        """
        Get content from a blob
        
        Args:
            pathname: Path/filename of the blob
            return_bytes: Whether to return raw bytes (True) or string (False)
            
        Returns:
            Content as string (default) or bytes, or None on error
        """
        try:
            # Construct the URL for accessing blobs
            # Note: In production, we'd have a more robust URL mechanism
            # This is a simplified approach
            response = requests.get(
                f"{self.api_url}/",
                headers={
                    'Authorization': f'Bearer {self.token}',
                },
                params={'pathname': pathname}
            )
            
            if response.status_code == 200:
                if return_bytes:
                    return response.content
                else:
                    return response.text
            else:
                logger.error(f"Failed to get blob: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            logger.error(f"Error getting blob: {str(e)}")
            return None
    
    def delete_blob(self, url: str) -> bool:
        """
        Delete a blob by its URL
        
        Args:
            url: Complete URL of the blob to delete
            
        Returns:
            True if deletion was successful, False otherwise
        """
        if not self.token:
            logger.error("Cannot delete blob: Missing Vercel Blob token")
            return False
            
        headers = {'Authorization': f'Bearer {self.token}'}
        
        try:
            response = requests.delete(
                url,
                headers=headers
            )
            
            if response.status_code == 200:
                return True
            else:
                logger.error(f"Failed to delete blob: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            logger.error(f"Error deleting blob: {str(e)}")
            return False


# Helper functions for direct usage
def is_vercel_environment():
    """Check if the code is running in a Vercel environment"""
    return os.environ.get('VERCEL', '0') == '1'

def put(pathname, content, options=None):
    """
    Upload content to Vercel Blob (helper function)
    
    Args:
        pathname: Path/filename for the blob
        content: Content to upload (string, bytes, or JSON-serializable object)
        options: Dictionary of options ('access': 'public'|'private')
        
    Returns:
        Dictionary with blob information including URL
    """
    client = VercelBlobClient()
    
    # Handle JSON objects
    if not isinstance(content, (str, bytes)) and content is not None:
        content = json.dumps(content)
    
    # Default options
    opts = {'access': 'public'}
    if options:
        opts.update(options)
        
    content_type = 'application/json' if pathname.endswith('.json') else 'text/plain'
    
    return client.put_blob(
        pathname=pathname,
        content=content,
        content_type=content_type,
        access=opts.get('access', 'public')
    )

def get(pathname):
    """
    Get content from a blob (helper function)
    
    Args:
        pathname: Path/filename of the blob
        
    Returns:
        Blob object with content accessible via text() method
    """
    client = VercelBlobClient()
    content = client.get_blob(pathname)
    
    class BlobResponse:
        def __init__(self, content):
            self._content = content
            
        def text(self):
            return self._content
    
    return BlobResponse(content)

def list_blobs(prefix=None):
    """
    List blobs with optional prefix (helper function)
    
    Args:
        prefix: Optional prefix to filter blobs by
        
    Returns:
        Object with 'blobs' attribute containing list of blob objects
    """
    client = VercelBlobClient()
    blobs = client.list_blobs(prefix=prefix)
    
    class BlobList:
        def __init__(self, blobs):
            self.blobs = blobs
    
    return BlobList(blobs)

def delete(url):
    """
    Delete a blob by its URL (helper function)
    
    Args:
        url: Complete URL of the blob to delete
        
    Returns:
        True if deletion was successful, False otherwise
    """
    client = VercelBlobClient()
    return client.delete_blob(url)