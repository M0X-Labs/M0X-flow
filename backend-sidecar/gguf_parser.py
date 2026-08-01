import struct
from pathlib import Path
from typing import Dict, Any

def parse_gguf_metadata(filepath: Path, max_keys: int = 200) -> Dict[str, Any]:
    """Parse a GGUF file header to extract key-value metadata."""
    metadata = {}
    try:
        with open(filepath, "rb") as f:
            magic = f.read(4)
            if magic != b"GGUF":
                return metadata

            version_data = f.read(4)
            if not version_data:
                return metadata
            version = struct.unpack("<I", version_data)[0]

            tensor_count_data = f.read(8)
            kv_count_data = f.read(8)
            if not tensor_count_data or not kv_count_data:
                return metadata
                
            tensor_count = struct.unpack("<Q", tensor_count_data)[0]
            kv_count = struct.unpack("<Q", kv_count_data)[0]

            for _ in range(min(kv_count, max_keys)):
                # Read key string length
                klen_data = f.read(8)
                if not klen_data:
                    break
                klen = struct.unpack("<Q", klen_data)[0]
                
                # Read key string
                key_bytes = f.read(klen)
                try:
                    key = key_bytes.decode("utf-8")
                except:
                    key = f"unknown_{_}"

                # Read value type
                vtype_data = f.read(4)
                if not vtype_data:
                    break
                vtype = struct.unpack("<I", vtype_data)[0]

                # Read value
                val = None
                if vtype == 0:  # UINT8
                    val = struct.unpack("<B", f.read(1))[0]
                elif vtype == 1:  # INT8
                    val = struct.unpack("<b", f.read(1))[0]
                elif vtype == 2:  # UINT16
                    val = struct.unpack("<H", f.read(2))[0]
                elif vtype == 3:  # INT16
                    val = struct.unpack("<h", f.read(2))[0]
                elif vtype == 4:  # UINT32
                    val = struct.unpack("<I", f.read(4))[0]
                elif vtype == 5:  # INT32
                    val = struct.unpack("<i", f.read(4))[0]
                elif vtype == 6:  # FLOAT32
                    val = struct.unpack("<f", f.read(4))[0]
                elif vtype == 7:  # BOOL
                    val = struct.unpack("<?", f.read(1))[0]
                elif vtype == 8:  # STRING
                    slen = struct.unpack("<Q", f.read(8))[0]
                    val = f.read(slen).decode("utf-8", errors="ignore")
                elif vtype == 9:  # ARRAY
                    atype = struct.unpack("<I", f.read(4))[0]
                    acount = struct.unpack("<Q", f.read(8))[0]
                    # We just skip arrays to avoid complex parsing since we don't need them
                    # Calculate bytes to skip
                    skip_bytes = 0
                    if atype in (0, 1, 7): skip_bytes = acount * 1
                    elif atype in (2, 3): skip_bytes = acount * 2
                    elif atype in (4, 5, 6): skip_bytes = acount * 4
                    elif atype in (10, 11, 12): skip_bytes = acount * 8
                    elif atype == 8: # Array of strings
                        for _ in range(acount):
                            slen = struct.unpack("<Q", f.read(8))[0]
                            f.read(slen)
                    
                    if skip_bytes > 0:
                        f.read(skip_bytes)
                elif vtype == 10: # UINT64
                    val = struct.unpack("<Q", f.read(8))[0]
                elif vtype == 11: # INT64
                    val = struct.unpack("<q", f.read(8))[0]
                elif vtype == 12: # FLOAT64
                    val = struct.unpack("<d", f.read(8))[0]
                else:
                    break # Unknown type, can't continue safely

                if val is not None:
                    metadata[key] = val

    except Exception as e:
        pass
        
    return metadata
