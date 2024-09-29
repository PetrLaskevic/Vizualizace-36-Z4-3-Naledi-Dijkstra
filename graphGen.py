from collections import deque
#bez numpy, one pass attempt
# maze = """
# #..
# .#.
# #..
# ..."""


maze = """
#..
.#.
...
..."""

maze = [ list(row) for row in maze.split('\n')[1:]]
print(*maze, sep="\n")

#setting corners
if maze[0][0] != '#':
	maze[0][0] = 'a'

if maze[0][-1] != '#':
	maze[0][-1] = 'a'

if maze[-1][0] != '#':
	maze[-1][0] = 'a'

if maze[-1][-1] != '#':
	maze[-1][-1] = 'a'


def markOkolniPole(row_zastaveni, column_zastaveni, pocet_rows, pocet_columns):
	global maze

	mozna_policka = [
		(row_zastaveni - 1, column_zastaveni, '|'),
		(row_zastaveni + 1, column_zastaveni, '|'),
		(row_zastaveni, column_zastaveni + 1, '-'),
		(row_zastaveni, column_zastaveni - 1, "-")
	]

	for x1, y1, znak in mozna_policka:
		if 0 <= x1 < pocet_rows and 0 <= y1 < pocet_columns:
			if maze[x1][y1] not in ('#', 'C', 'S', 'a'): #pokud je okolni pole krizek, tak ho samozrejme prenastavovat nebudeme
				if (maze[x1][y1] == '|' and znak == '-') or (maze[x1][y1] == '-' and znak == '|'):
					maze[x1][y1] = 'a'
				else:
					maze[x1][y1] = znak


#As borders are stops, setting them as such (as though the entire maze was surrounded by '#'):

#setting the top edge with | to simplify graph generation code
for index, znak in enumerate(maze[0]):
	if znak == '.':
		maze[0][index] = '|' 

#setting the bottom edge with | to simplify graph generation code
for index, znak in enumerate(maze[-1]):
	if znak == '.':
		maze[-1][index] = '|' 

for indexRadky, radka in enumerate(maze):
	print(indexRadky)
	for indexZnaku, znak in enumerate(radka):
		if znak == '#':
			print("pos", indexRadky, indexZnaku)
			markOkolniPole(indexRadky, indexZnaku, len(maze), len(maze[0]))
	#setting left and right adges to - to simplify graph generation code
	if radka[-1] == '.':
		maze[indexRadky][indexZnaku] = '-'
	if radka[0] == '.':
		maze[indexRadky][0] = '-'


#python 3.12
# type coordinates = tuple[int, int]
# type edge = list[coordinates, int]
# python 3.10 backwards compatibility https://docs.python.org/3/library/typing.html

coordinates = tuple[int, int]
edge = list[coordinates, int]

print(*maze, sep="\n")
class Graf:
	def __init__(self):
		self.graf : dict[coordinates, edge] = {} #tohle je type hint

	def add(self, coordsFrom : tuple[int, int], coordsTo : tuple[int, int],  weight : int, orientation):
		#eliminate meaningless edges:
		#edges of length 0 when ### (cross between crosses)
		#edges of length 1 when #.# (dot between crosses) = deadend = path ends there, not useful
		if weight <= 1:
			return
		
		#two oppositely directed edges = one undirected edge
		if orientation == 'undirected':
			#first edge
			if coordsFrom in self.graf:
				#aby nebyly duplikaty na 
				# maze = """
				# 	#..
				# 	.#.
				# 	#..
				# 	..."""
				#  (0, 1): [((0, 2), 2), ((0, 2), 2)],
				#ze jo jedna hrana | to right wall
				# druha hrana - to right wall
				#one node can only have 3 edges maximum so its ok
				if (coordsTo, weight) not in self.graf[coordsFrom]:
					self.graf[coordsFrom].append((coordsTo, weight))
			else:
				self.graf[coordsFrom] = [(coordsTo, weight)]
			#second edge
			if coordsTo in self.graf:
				if (coordsFrom, weight) not in self.graf[coordsTo]:
					self.graf[coordsTo].append((coordsFrom, weight))
			else:
				self.graf[coordsTo] = [(coordsFrom, weight)]

		elif orientation == 'directed':
			if coordsFrom in self.graf:
				if (coordsTo, weight) not in self.graf[coordsFrom]:
					self.graf[coordsFrom].append((coordsTo, weight))
			else:
				self.graf[coordsFrom] = [(coordsTo, weight)]


class TwoItems:
	'''
	Computes distance between two '#' characters in a line / column. \n
	Example: `#...#` => `self.numDots == 3`

	:param mode: horizontal (for lines) / vertical (for columns)

	Use `pushO(value: coordinates)` to add a character.

	When two characters have been added, self.readyToOutput is True, and a graph edge is returned.
	
	Use coordinates of a character next to a '#': \n
	- horizontally (a '-' character) \n
	- or vertically (a '|' character) \n
	- or both (a 'a' character) \n
	Do not push coordinates of a '#' character, as the calculation will be wrong.
	'''
	def __init__(self, mode: str): #mode vertical/horizontal
		self.lis = deque()
		self.prevItem : coordinates
		self.numDots : int
		self.mode = mode
		self.readyToOutput = False
		self.setInitialValue = False
		
	def pushO(self, value: coordinates):
		'''
		Computes the distance (self.numDots) to a previously added character and removes it from memory. 
		Saves the character you added for the next call. \n
		Used when adding edges between two '#' characters on the same line / column, makes an undirected edge between them.
		'''
		self.setInitialValue = True
		radka,znak = value
		self.lis.append(value)

		if len(self.lis) == 2: #full
			self.readyToOutput = True
		elif len(self.lis) == 1:
			#previous action was reset(), so the item we added now is the only value
			# => so we WILL NOT pop it out and say radka, znak == previousRadka, previousZnak
			self.readyToOutput = False
			return
		
		previousRadka, previousZnak =  self.lis.popleft()

		if self.mode == "horizontal":
			self.prevItem = (previousRadka, previousZnak)
			self.numDots = znak - previousZnak + 1
		elif self.mode == "vertical":
			self.prevItem = (previousRadka, previousZnak)
			self.numDots = radka - previousRadka + 1
	
	def peekO(self, value: coordinates):
		'''
		Computes the distance (self.numDots) to a previously added character without removing the character. \n
		Used when adding: \n
		- leftward (in the direction of decreasing indexZnaku) edges \n
		- upward (in the direction of decreasing indexRakdy) edges \n
		'''

		# example ['#', '|', '|', '#'], 
		# on second character there is no previous character to show
		#so readyToOuput is used here so:
		# - leftward (in the direction of decreasing indexZnaku) edges
		# - upward (in the direction of decreasing indexRakdy) edges
		#are only added to the graph when there is a character for them to stem from
		if len(self.lis) == 0:
			self.readyToOutput = False
			return
		else:
			self.readyToOutput = True
		radka,znak = value
		previousRadka, previousZnak =  self.lis[0]
		self.prevItem = (previousRadka, previousZnak)
		if self.mode == "horizontal":
			self.numDots = znak - previousZnak + 1
		elif self.mode == "vertical":
			self.numDots = radka - previousRadka + 1
		

	def reset(self):
		self.lis.clear()
		self.readyToOutput = False


class HranyDoprava:
	'''
	:param mode: horizontal (for lines) / vertical (for columns) 
	
	**Line mode:**
	
	Computes distances from all '|' on the top and bottom sides of '#' on the line \n
	to '-' on the left of the next '#' or to the right end of line and generates the respective edges.

	**Column mode:**

	Computes distances from '-' on the left and right sides of all '#' on the line \n
	to '|' on the top side of next '#' or to the bottom bottom end of column and generates the respective edges.

	Examples:

	Line mode:

	.. code-block:: plaintext

		||.-# 
		##...

	Directed edges from both '|' to the right to the '-'

	Column mode:

	.. code-block:: plaintext

		-####
		.....
		|
		#....

	Directed edge from '-' to '|'


	Directed edges from '|' to the LEFT (to '-' or left border) are handled by TwoItems.pushO on the '-' or border and by TwoItems.peekO on the '|'
	Directed edges from '-' to the TOP (to '|' or top border) are handled same (but vertical mode on TwoItems)

	'''
	


	# (holt proste misto ready to output je cast pridavani grafu tady)
	
	def __init__(self, mode : str):
		self.lis = []
		self.mode = mode
		self.setInitialValue = False
		
	def addHranaOdsud(self, coordinates : coordinates):
		'''Add edge from this node (edge going to node specified when calling getEdgeData) '''
		self.setInitialValue = True
		self.lis.append(coordinates)
	
	def getEdgeData(self, stopNode: coordinates) -> tuple[coordinates, coordinates, int, str] : #harvest
		#stop node = character, kde se to zastavilo = - pred # nebo okraj
		#kazdopadne je vcetne
		stopX, stopY = stopNode
		returnList : tuple[coordinates, coordinates, int, str] = [] #((x,y), (stopX, stopY), numDots, 'directed')
		for x,y in self.lis:
			numDots = 0
			if self.mode == "horizontal":
				numDots = stopY - y + 1
			elif self.mode == "vertical":
				numDots = stopX - x + 1
			returnList.append(((x,y), (stopX, stopY), numDots, 'directed'))

		return returnList

	def reset(self):
		self.lis.clear()


graf = Graf()
hranyNahoru : list[TwoItems] = []
hranyDolu : list[HranyDoprava] = []
for x in range(len(maze[0])):
	hranyNahoru.append(TwoItems("vertical"))
	hranyDolu.append(HranyDoprava("vertical"))


for indexRadky, radka in enumerate(maze):

	hranyDoleva = TwoItems("horizontal")
	hranyDoprava = HranyDoprava("horizontal")
	
	for indexZnaku, znak in enumerate(radka):
		
		if znak != '#':
			#initialize all 4 directions of edges
			if not hranyDoleva.setInitialValue:
				hranyDoleva.pushO((indexRadky, indexZnaku))

			if not hranyDoprava.setInitialValue:
				hranyDoprava.addHranaOdsud((indexRadky, indexZnaku))

			if not hranyNahoru[indexZnaku].setInitialValue:
				hranyNahoru[indexZnaku].pushO((indexRadky, indexZnaku))

			if not hranyDolu[indexZnaku].setInitialValue:
				hranyDolu[indexZnaku].addHranaOdsud((indexRadky, indexZnaku))

		if znak in ('-','a'): # a = both - and |
			
			hranyDoleva.pushO((indexRadky, indexZnaku))
			
			if hranyDoleva.readyToOutput:
				graf.add(hranyDoleva.prevItem, (indexRadky, indexZnaku), hranyDoleva.numDots, 'undirected')
			#from | to -#.
			#     #.......
			for hrana in hranyDoprava.getEdgeData((indexRadky, indexZnaku)):
				graf.add(*hrana)
				hranyDoprava.reset()
			
			#vertical handling:
			hranyNahoru[indexZnaku].peekO((indexRadky, indexZnaku))
			if hranyNahoru[indexZnaku].readyToOutput:
				graf.add((indexRadky, indexZnaku), hranyNahoru[indexZnaku].prevItem, hranyNahoru[indexZnaku].numDots, 'directed')
			#hrana odsud dolu (do dolniho zastaveni)
			hranyDolu[indexZnaku].addHranaOdsud((indexRadky, indexZnaku))
			
		if znak in ('|', 'a'):
			#prida orientovanou hranu z nejvic leveho volneho znaku do naseho znaku |
			hranyDoleva.peekO((indexRadky, indexZnaku))
			if hranyDoleva.readyToOutput:
				graf.add((indexRadky, indexZnaku), hranyDoleva.prevItem, hranyDoleva.numDots, 'directed')
				
			hranyDoprava.addHranaOdsud((indexRadky, indexZnaku))

			#vertical handling
			hranyNahoru[indexZnaku].pushO((indexRadky, indexZnaku))
			if hranyNahoru[indexZnaku].readyToOutput:
				graf.add(hranyNahoru[indexZnaku].prevItem, (indexRadky, indexZnaku) , hranyNahoru[indexZnaku].numDots, 'undirected')
			
			#from - to |
			# ...-#...
			# ....|...
			# ...|....
			# ...#....
			for hrana in hranyDolu[indexZnaku].getEdgeData((indexRadky, indexZnaku)):
				graf.add(*hrana)
				hranyDolu[indexZnaku].reset()

			
		elif znak == '#': #pres krizky cesta z o do o nikdy nevede
			hranyDoleva.reset()
			hranyNahoru[indexZnaku].reset()
			hranyDolu[indexZnaku].reset()
			hranyDoprava.reset()


import pprint
pp = pprint.PrettyPrinter(indent=4, compact=False, depth=4) #todo: figure out these pretty print options
print("result is")
pp.pprint(graf.graf)
