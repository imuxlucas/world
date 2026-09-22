"""Render a thumbnail without saving preview-only objects into the source."""
import bpy, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
import polish_round_two as preview_tools

def preview_material(name, color, rough=.5):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
    output = material.node_tree.nodes.new('ShaderNodeOutputMaterial')
    material.node_tree.links.new(shader.outputs['BSDF'], output.inputs['Surface'])
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Roughness'].default_value = rough
    return material

preview_tools.b.material = preview_material
preview_tools.preview('carousel', Path(__file__).resolve().parents[2] / 'public/assets/carousel/v006')
